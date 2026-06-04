'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireActor } from '@/lib/auth';
import { createClient, updateClient } from '@/lib/data/clients';
import { syncMetaForClient } from '@/lib/meta';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = v ? String(v).trim() : '';
  return s || null;
}
function feeCents(fd: FormData) {
  const v = fd.get('monthly_fee_eur');
  return v && String(v).trim() ? Math.round(Number(v) * 100) : 0;
}

export async function createClientAction(formData: FormData) {
  const actor = await requireActor();
  const name = str(formData, 'name');
  if (!name) throw new Error('El nombre es obligatorio');
  const client = await createClient(actor, {
    name,
    industry: str(formData, 'industry'),
    contact_name: str(formData, 'contact_name'),
    contact_email: str(formData, 'contact_email'),
    contact_phone: str(formData, 'contact_phone'),
    monthly_fee_cents: feeCents(formData),
    color: str(formData, 'color'),
  });
  revalidatePath('/clients');
  revalidatePath('/dashboard');
  redirect(`/clients/${client.id}`);
}

export async function updateClientAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  await updateClient(actor, id, {
    name: str(formData, 'name') ?? undefined,
    industry: str(formData, 'industry'),
    contact_name: str(formData, 'contact_name'),
    contact_email: str(formData, 'contact_email'),
    contact_phone: str(formData, 'contact_phone'),
    monthly_fee_cents: feeCents(formData),
    color: str(formData, 'color'),
    status: (str(formData, 'status') as 'active' | 'paused' | 'archived' | null) ?? undefined,
  });
  revalidatePath(`/clients/${id}`);
  revalidatePath('/clients');
}

export async function syncClientMetaAction(formData: FormData) {
  await requireActor();
  const id = String(formData.get('id'));
  await syncMetaForClient(id);
  revalidatePath(`/clients/${id}`);
  revalidatePath('/campaigns');
  revalidatePath('/dashboard');
}
