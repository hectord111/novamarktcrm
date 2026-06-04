import 'server-only';
import { sql } from '../db';
import { isAgency, type Actor, type AppUser, type UserRole } from '../types';

export async function listUsers(actor: Actor): Promise<(AppUser & { client_name: string | null })[]> {
  if (!isAgency(actor)) return [];
  const rows = await sql`
    select u.*, c.name as client_name
    from nova.users u left join nova.clients c on c.id = u.client_id
    order by (u.role = 'owner') desc, u.created_at`;
  return rows as unknown as (AppUser & { client_name: string | null })[];
}

export async function updateUserRole(actor: Actor, id: string, role: UserRole, clientId: string | null) {
  if (actor.role !== 'owner' && actor.role !== 'admin') throw new Error('FORBIDDEN');
  await sql`
    update nova.users
    set role = ${role}, client_id = ${role === 'client' ? clientId : null}, is_active = true
    where id = ${id}`;
  return true;
}
