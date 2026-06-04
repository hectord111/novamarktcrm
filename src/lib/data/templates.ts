import 'server-only';
import { sql } from '../db';
import { isAgency, type Actor, type Channel, type MessageTemplate } from '../types';

export async function listTemplates(actor: Actor): Promise<(MessageTemplate & { client_name: string | null })[]> {
  const scope = isAgency(actor) ? sql`true` : sql`(t.client_id = ${actor.client_id} or t.client_id is null)`;
  const rows = await sql`
    select t.*, cl.name as client_name from nova.message_templates t
    left join nova.clients cl on cl.id = t.client_id
    where ${scope} order by t.client_id nulls first, t.name`;
  return rows as unknown as (MessageTemplate & { client_name: string | null })[];
}

export async function createTemplate(
  actor: Actor,
  input: { name: string; channel: Channel; subject?: string | null; body: string; client_id?: string | null },
) {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  const [t] = await sql`
    insert into nova.message_templates (name, channel, subject, body, client_id)
    values (${input.name}, ${input.channel}, ${input.subject ?? null}, ${input.body}, ${input.client_id ?? null})
    returning *`;
  return t as unknown as MessageTemplate;
}

export async function deleteTemplate(actor: Actor, id: string) {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  await sql`delete from nova.message_templates where id = ${id}`;
  return true;
}
