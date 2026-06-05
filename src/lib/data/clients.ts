import 'server-only';
import { sql } from '../db';
import { isAgency, type Actor, type Client, type Campaign } from '../types';

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export interface ClientListItem extends Client {
  leads: number;
  converted: number;
  active_campaigns: number;
  spend30_cents: number;
}

export async function listClients(actor: Actor): Promise<ClientListItem[]> {
  const scope = isAgency(actor) ? sql`c.kind = 'client'` : sql`c.id = ${actor.client_id}`;
  const rows = await sql`
    select c.*,
      coalesce(l.leads, 0)::int            as leads,
      coalesce(l.converted, 0)::int        as converted,
      coalesce(cm.active_campaigns, 0)::int as active_campaigns,
      coalesce(sp.spend, 0)::int           as spend30_cents
    from nova.clients c
    left join (select client_id, count(*) leads, count(*) filter (where status = 'converted') converted
               from nova.leads group by client_id) l on l.client_id = c.id
    left join (select client_id, count(*) active_campaigns from nova.campaigns where status = 'active' group by client_id) cm on cm.client_id = c.id
    left join (select c2.client_id, sum(m.spend_cents) spend from nova.campaign_metrics m
               join nova.campaigns c2 on c2.id = m.campaign_id where m.date >= current_date - 29 group by c2.client_id) sp on sp.client_id = c.id
    where ${scope}
    order by (c.status = 'archived'), c.name`;
  return rows as unknown as ClientListItem[];
}

export async function getClient(actor: Actor, id: string) {
  const scope = isAgency(actor) ? sql`true` : sql`c.id = ${actor.client_id}`;
  const [client] = await sql`select * from nova.clients c where c.id = ${id} and ${scope} limit 1`;
  if (!client) return null;
  const campaigns = await sql`select * from nova.campaigns where client_id = ${id} order by created_at desc`;
  const adAccounts = await sql`select * from nova.ad_accounts where client_id = ${id} order by created_at`;
  return {
    client: client as unknown as Client,
    campaigns: campaigns as unknown as Campaign[],
    adAccounts: adAccounts as unknown as { id: string; meta_ad_account_id: string; name: string | null }[],
  };
}

export interface ClientInput {
  name: string;
  industry?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  monthly_fee_cents?: number;
  color?: string | null;
  status?: 'active' | 'paused' | 'archived';
  notes?: string | null;
}

export async function createClient(actor: Actor, input: ClientInput): Promise<Client> {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  let slug = slugify(input.name) || 'cliente';
  const [exists] = await sql`select 1 from nova.clients where slug = ${slug} limit 1`;
  if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const [c] = await sql`
    insert into nova.clients (name, slug, industry, contact_name, contact_email, contact_phone, monthly_fee_cents, color, status, notes)
    values (${input.name}, ${slug}, ${input.industry ?? null}, ${input.contact_name ?? null}, ${input.contact_email ?? null},
            ${input.contact_phone ?? null}, ${input.monthly_fee_cents ?? 0}, ${input.color ?? null}, ${input.status ?? 'active'}, ${input.notes ?? null})
    returning *`;
  return c as unknown as Client;
}

export async function updateClient(actor: Actor, id: string, patch: Partial<ClientInput>): Promise<boolean> {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  await sql`
    update nova.clients set
      name = coalesce(${patch.name ?? null}, name),
      industry = ${patch.industry ?? null},
      contact_name = ${patch.contact_name ?? null},
      contact_email = ${patch.contact_email ?? null},
      contact_phone = ${patch.contact_phone ?? null},
      monthly_fee_cents = coalesce(${patch.monthly_fee_cents ?? null}::int, monthly_fee_cents),
      color = ${patch.color ?? null},
      status = coalesce(${patch.status ?? null}, status),
      notes = ${patch.notes ?? null}
    where id = ${id}`;
  return true;
}

export async function listClientOptions(actor: Actor) {
  const scope = isAgency(actor) ? sql`status <> 'archived'` : sql`id = ${actor.client_id}`;
  const rows = await sql`select id, name, color, slug, kind from nova.clients where ${scope} order by (kind <> 'internal'), name`;
  return rows as unknown as { id: string; name: string; color: string | null; slug: string; kind: 'client' | 'internal' }[];
}
