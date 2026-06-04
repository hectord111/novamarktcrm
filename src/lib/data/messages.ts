import 'server-only';
import { sql } from '../db';
import { isAgency, type Actor, type Message } from '../types';

export async function listRecentMessages(actor: Actor, limit = 60) {
  const scope = isAgency(actor) ? sql`true` : sql`m.client_id = ${actor.client_id}`;
  const rows = await sql`
    select m.*, l.full_name as lead_name, cl.name as client_name
    from nova.messages m
    left join nova.leads l on l.id = m.lead_id
    left join nova.clients cl on cl.id = m.client_id
    where ${scope}
    order by m.created_at desc limit ${limit}`;
  return rows as unknown as (Message & { lead_name: string | null; client_name: string | null })[];
}

export interface RecordMessageInput {
  lead_id?: string | null;
  client_id?: string | null;
  channel?: string;
  direction?: 'outbound' | 'inbound';
  to_address?: string | null;
  body?: string | null;
  status: Message['status'];
  provider?: string | null;
  provider_message_id?: string | null;
  error?: string | null;
  template_id?: string | null;
  automation_run_id?: string | null;
}

export async function recordMessage(input: RecordMessageInput): Promise<Message> {
  const sentAt = input.status === 'sent' || input.status === 'simulated' || input.status === 'delivered' ? sql`now()` : null;
  const [m] = await sql`
    insert into nova.messages (lead_id, client_id, channel, direction, to_address, body, status, provider,
                              provider_message_id, error, template_id, automation_run_id, sent_at)
    values (${input.lead_id ?? null}, ${input.client_id ?? null}, ${input.channel ?? 'whatsapp'}, ${input.direction ?? 'outbound'},
            ${input.to_address ?? null}, ${input.body ?? null}, ${input.status}, ${input.provider ?? null},
            ${input.provider_message_id ?? null}, ${input.error ?? null}, ${input.template_id ?? null},
            ${input.automation_run_id ?? null}, ${sentAt})
    returning *`;
  return m as unknown as Message;
}

export async function getMessageStats(actor: Actor, days = 30) {
  const scope = isAgency(actor) ? sql`true` : sql`m.client_id = ${actor.client_id}`;
  const [row] = await sql`
    select count(*)::int as total,
           count(*) filter (where status in ('sent','delivered','read','simulated'))::int as delivered
    from nova.messages m
    where ${scope} and m.created_at >= current_date - ${days}::int`;
  return row as unknown as { total: number; delivered: number };
}
