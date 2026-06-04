import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, supabaseConfigured } from './supabase/server';
import { sql, dbConfigured } from './db';
import type { Actor } from './types';

/**
 * Resolve the current authenticated user into an Actor (auth identity + tenant scope).
 * Provisions a `nova.users` row on first login:
 *   - the very first user to sign in becomes the agency `owner`
 *   - invited users carry their role/client_id in auth metadata
 *   - anyone else lands as an inactive `client` (pending access)
 */
export const getActor = cache(async (): Promise<Actor | null> => {
  if (!dbConfigured() || !supabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rows = await sql`
    select id, email, full_name, role, client_id, is_active
    from nova.users where id = ${user.id} limit 1`;
  if (rows.length) {
    const u = rows[0];
    return {
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      client_id: u.client_id,
      is_active: u.is_active,
    };
  }

  const [{ count }] = await sql`select count(*)::int as count from nova.users`;
  const meta = (user.user_metadata ?? {}) as { role?: string; client_id?: string; full_name?: string };
  let role: Actor['role'] = 'client';
  let clientId: string | null = meta.client_id ?? null;
  let isActive = false;
  if (count === 0) {
    role = 'owner';
    clientId = null;
    isActive = true;
  } else if (meta.role) {
    role = meta.role as Actor['role'];
    isActive = true;
  }
  const fullName = meta.full_name ?? user.email?.split('@')[0] ?? null;
  await sql`
    insert into nova.users (id, email, full_name, role, client_id, is_active)
    values (${user.id}, ${user.email ?? ''}, ${fullName}, ${role}, ${clientId}, ${isActive})
    on conflict (id) do nothing`;

  return { id: user.id, email: user.email ?? '', full_name: fullName, role, client_id: clientId, is_active: isActive };
});

/** Require an active actor or redirect to login / pending screen. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect('/login');
  if (!actor.is_active) redirect('/pending');
  return actor;
}
