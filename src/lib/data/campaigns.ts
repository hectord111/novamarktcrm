import 'server-only';
import { sql } from '../db';
import { isAgency, type Actor, type Campaign } from '../types';

export interface CampaignListItem extends Campaign {
  client_name: string;
  client_color: string | null;
  leads: number;
  converted: number;
  spend30_cents: number;
}

export async function listCampaigns(actor: Actor, opts: { clientId?: string } = {}): Promise<CampaignListItem[]> {
  const conds = [isAgency(actor) ? sql`true` : sql`c.client_id = ${actor.client_id}`];
  if (opts.clientId) conds.push(sql`c.client_id = ${opts.clientId}`);
  const where = conds.reduce((a, b) => sql`${a} and ${b}`);
  const rows = await sql`
    select c.*, cl.name as client_name, cl.color as client_color,
      coalesce(l.leads, 0)::int as leads,
      coalesce(l.converted, 0)::int as converted,
      coalesce(sp.spend, 0)::int as spend30_cents
    from nova.campaigns c
    join nova.clients cl on cl.id = c.client_id
    left join (select campaign_id, count(*) leads, count(*) filter (where status = 'converted') converted
               from nova.leads group by campaign_id) l on l.campaign_id = c.id
    left join (select campaign_id, sum(spend_cents) spend from nova.campaign_metrics
               where date >= current_date - 29 group by campaign_id) sp on sp.campaign_id = c.id
    where ${where}
    order by spend30_cents desc, c.created_at desc`;
  return rows as unknown as CampaignListItem[];
}

export interface CampaignInput {
  client_id: string;
  name: string;
  objective?: string | null;
  channel?: string;
  status?: 'active' | 'paused' | 'ended' | 'draft';
  daily_budget_cents?: number | null;
  meta_campaign_id?: string | null;
  ad_account_id?: string | null;
}

export async function createCampaign(actor: Actor, input: CampaignInput): Promise<Campaign> {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  const [c] = await sql`
    insert into nova.campaigns (client_id, name, objective, channel, status, daily_budget_cents, meta_campaign_id, ad_account_id, started_at)
    values (${input.client_id}, ${input.name}, ${input.objective ?? 'OUTCOME_LEADS'}, ${input.channel ?? 'meta'},
            ${input.status ?? 'active'}, ${input.daily_budget_cents ?? null}, ${input.meta_campaign_id ?? null},
            ${input.ad_account_id ?? null}, current_date)
    returning *`;
  return c as unknown as Campaign;
}

export async function updateCampaignStatus(actor: Actor, id: string, status: 'active' | 'paused' | 'ended' | 'draft') {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  await sql`update nova.campaigns set status = ${status} where id = ${id}`;
  return true;
}
