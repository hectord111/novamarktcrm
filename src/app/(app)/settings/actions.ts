'use server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireActor } from '@/lib/auth';
import { setGlobalSetting } from '@/lib/data/settings';
import { updateUserRole } from '@/lib/data/users';
import { createSupabaseAdminClient, adminConfigured } from '@/lib/supabase/admin';
import { sql } from '@/lib/db';
import type { UserRole } from '@/lib/types';

export async function updateWhatsappConfigAction(formData: FormData) {
  await requireActor();
  const mode = String(formData.get('mode')) === 'live' ? 'live' : 'simulation';
  const phone = String(formData.get('phone_number_id') || '').trim();
  await setGlobalSetting('whatsapp', { mode, provider: 'whatsapp_cloud', phone_number_id: phone });
  revalidatePath('/settings');
  revalidatePath('/messages');
}

export async function inviteUserAction(formData: FormData) {
  const actor = await requireActor();
  if (actor.role !== 'owner' && actor.role !== 'admin') throw new Error('Solo administradores pueden invitar');
  if (!adminConfigured()) throw new Error('Configura SUPABASE_SERVICE_ROLE_KEY para invitar usuarios');

  const email = String(formData.get('email') || '').trim();
  const role = (String(formData.get('role') || 'agent') as UserRole);
  const clientId = String(formData.get('client_id') || '') || null;
  if (!email) throw new Error('Email obligatorio');

  const admin = createSupabaseAdminClient();
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') || 'https'}://${h.get('host')}`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role, client_id: role === 'client' ? clientId : null },
    redirectTo: `${origin}/auth/callback`,
  });
  if (error) throw new Error(error.message);
  const u = data.user;
  if (u) {
    await sql`
      insert into nova.users (id, email, full_name, role, client_id, is_active)
      values (${u.id}, ${email}, ${email.split('@')[0]}, ${role}, ${role === 'client' ? clientId : null}, true)
      on conflict (id) do update set role = excluded.role, client_id = excluded.client_id, is_active = true`;
  }
  revalidatePath('/settings');
}

export async function updateUserAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  const role = String(formData.get('role')) as UserRole;
  const clientId = String(formData.get('client_id') || '') || null;
  await updateUserRole(actor, id, role, clientId);
  revalidatePath('/settings');
}
