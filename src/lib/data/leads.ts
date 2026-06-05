import 'server-only';
import { sql, toJson } from '../db';
import { isAgency, type Actor, type Lead, type LeadActivity, type LeadStatus, type Message } from '../types';

export interface LeadListItem extends Lead {
  client_name: string;
  client_color: string | null;
  campaign_name: string | null;
  assigned_name: string | null;
}

export interface LeadFilters {
  status?: LeadStatus;
  clientId?: string;
  excludeClientId?: string;
  campaignId?: string;
  source?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

function scope(actor: Actor) {
  if (isAgency(actor)) return sql`true`;
  return actor.client_id ? sql`l.client_id = ${actor.client_id}` : sql`false`;
}

export async function listLeads(actor: Actor, f: LeadFilters = {}) {
  const conds = [scope(actor)];
  if (f.status) conds.push(sql`l.status = ${f.status}`);
  if (f.clientId) conds.push(sql`l.client_id = ${f.clientId}`);
  if (f.excludeClientId) conds.push(sql`l.client_id <> ${f.excludeClientId}`);
  if (f.campaignId) conds.push(sql`l.campaign_id = ${f.campaignId}`);
  if (f.source) conds.push(sql`l.source = ${f.source}`);
  if (f.search) {
    const q = `%${f.search}%`;
    conds.push(sql`(l.full_name ilike ${q} or l.email ilike ${q} or l.phone ilike ${q})`);
  }
  const where = conds.reduce((a, c) => sql`${a} and ${c}`);
  const limit = Math.min(f.limit ?? 50, 200);
  const offset = f.offset ?? 0;

  const items = await sql`
    select l.*, c.name as client_name, c.color as client_color,
           cm.name as campaign_name, u.full_name as assigned_name
    from nova.leads l
    join nova.clients c on c.id = l.client_id
    left join nova.campaigns cm on cm.id = l.campaign_id
    left join nova.users u on u.id = l.assigned_to
    where ${where}
    order by l.created_at desc
    limit ${limit} offset ${offset}`;

  const [{ total }] = await sql`select count(*)::int as total from nova.leads l where ${where}`;
  return { items: items as unknown as LeadListItem[], total: total as number };
}

export async function countLeadsByStatus(actor: Actor, f: Omit<LeadFilters, 'status'> = {}) {
  const conds = [scope(actor)];
  if (f.clientId) conds.push(sql`l.client_id = ${f.clientId}`);
  if (f.excludeClientId) conds.push(sql`l.client_id <> ${f.excludeClientId}`);
  if (f.search) {
    const q = `%${f.search}%`;
    conds.push(sql`(l.full_name ilike ${q} or l.email ilike ${q} or l.phone ilike ${q})`);
  }
  const where = conds.reduce((a, c) => sql`${a} and ${c}`);
  const rows = await sql`select status, count(*)::int as n from nova.leads l where ${where} group by status`;
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r.n;
  return map;
}

export async function getLead(actor: Actor, id: string) {
  const [lead] = await sql`
    select l.*, c.name as client_name, c.color as client_color, c.slug as client_slug,
           cm.name as campaign_name, u.full_name as assigned_name
    from nova.leads l
    join nova.clients c on c.id = l.client_id
    left join nova.campaigns cm on cm.id = l.campaign_id
    left join nova.users u on u.id = l.assigned_to
    where l.id = ${id} and ${scope(actor)} limit 1`;
  if (!lead) return null;
  const activities = await sql`
    select a.*, u.full_name as user_name from nova.lead_activities a
    left join nova.users u on u.id = a.user_id
    where a.lead_id = ${id} order by a.created_at desc`;
  const messages = await sql`
    select * from nova.messages where lead_id = ${id} order by created_at desc`;
  return {
    lead: lead as unknown as LeadListItem & { client_slug: string },
    activities: activities as unknown as (LeadActivity & { user_name: string | null })[],
    messages: messages as unknown as Message[],
  };
}

export interface CreateLeadInput {
  client_id: string;
  campaign_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string;
  status?: LeadStatus;
  custom_fields?: Record<string, unknown>;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  meta_lead_id?: string | null;
}

/** Insert a lead and log the creation activity. Returns the new lead row. */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const [lead] = await sql`
    insert into nova.leads
      (client_id, campaign_id, full_name, email, phone, source, status, custom_fields,
       utm_source, utm_medium, utm_campaign, meta_lead_id)
    values
      (${input.client_id}, ${input.campaign_id ?? null}, ${input.full_name ?? null}, ${input.email ?? null},
       ${input.phone ?? null}, ${input.source ?? 'manual'}, ${input.status ?? 'new'},
       ${toJson(input.custom_fields ?? {})}, ${input.utm_source ?? null}, ${input.utm_medium ?? null},
       ${input.utm_campaign ?? null}, ${input.meta_lead_id ?? null})
    on conflict (meta_lead_id) where meta_lead_id is not null do nothing
    returning *`;
  if (!lead) {
    // Duplicate meta_lead_id — return the existing row.
    const [existing] = await sql`select * from nova.leads where meta_lead_id = ${input.meta_lead_id ?? null} limit 1`;
    return existing as unknown as Lead;
  }
  await logActivity(lead.id, null, 'created', `Lead recibido desde ${input.source ?? 'manual'}`);
  return lead as unknown as Lead;
}

export async function logActivity(
  leadId: string,
  userId: string | null,
  type: string,
  content: string | null,
  metadata: Record<string, unknown> = {},
) {
  await sql`
    insert into nova.lead_activities (lead_id, user_id, type, content, metadata)
    values (${leadId}, ${userId}, ${type}, ${content}, ${toJson(metadata)})`;
}

export async function updateLeadStatus(actor: Actor, id: string, status: LeadStatus, extra?: { value_cents?: number | null; lost_reason?: string | null }) {
  const [current] = await sql`select status from nova.leads l where l.id = ${id} and ${scope(actor)} limit 1`;
  if (!current) return false;

  const newValue = extra?.value_cents ?? null;
  const lostReason = extra?.lost_reason ?? null;
  await sql`
    update nova.leads set
      status = ${status},
      first_contact_at = case when first_contact_at is null and ${status} <> 'new' then now() else first_contact_at end,
      converted_at = case when ${status} = 'converted' then coalesce(converted_at, now())
                          when ${status} <> 'converted' then null
                          else converted_at end,
      value_cents = case when ${status} = 'converted' and ${newValue}::int is not null then ${newValue}::int else value_cents end,
      lost_reason = case when ${status} = 'lost' then ${lostReason} else null end
    where id = ${id}`;
  await logActivity(id, actor.id, 'status_change', `Estado cambiado a ${status}`, { from: current.status, to: status });
  return true;
}

export async function addNote(actor: Actor, leadId: string, content: string) {
  const [ok] = await sql`select 1 from nova.leads l where l.id = ${leadId} and ${scope(actor)} limit 1`;
  if (!ok) return false;
  await logActivity(leadId, actor.id, 'note', content);
  return true;
}

export async function assignLead(actor: Actor, leadId: string, userId: string | null) {
  const [ok] = await sql`select 1 from nova.leads l where l.id = ${leadId} and ${scope(actor)} limit 1`;
  if (!ok) return false;
  await sql`update nova.leads set assigned_to = ${userId} where id = ${leadId}`;
  await logActivity(leadId, actor.id, 'assigned', userId ? 'Lead asignado' : 'Asignación retirada');
  return true;
}
