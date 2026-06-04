import 'server-only';
import { sql, toJson } from '../db';
import { isAgency, type Actor, type Ad, type AdAudience, type AdDestination, type AdPreset, type AdStatus } from '../types';

export async function listPresets(actor: Actor): Promise<AdPreset[]> {
  const scope = isAgency(actor) ? sql`true` : sql`(client_id is null or client_id = ${actor.client_id})`;
  const rows = await sql`select * from nova.ad_presets where ${scope} order by (industry is null), industry, name`;
  return rows as unknown as AdPreset[];
}

export async function getPreset(id: string): Promise<AdPreset | null> {
  const [p] = await sql`select * from nova.ad_presets where id = ${id} limit 1`;
  return (p as unknown as AdPreset) ?? null;
}

export interface AdListItem extends Ad {
  client_name: string;
  client_color: string | null;
}

export async function listAds(actor: Actor, opts: { clientId?: string } = {}): Promise<AdListItem[]> {
  const conds = [isAgency(actor) ? sql`true` : sql`a.client_id = ${actor.client_id}`];
  if (opts.clientId) conds.push(sql`a.client_id = ${opts.clientId}`);
  const where = conds.reduce((x, y) => sql`${x} and ${y}`);
  const rows = await sql`
    select a.*, c.name as client_name, c.color as client_color
    from nova.ads a join nova.clients c on c.id = a.client_id
    where ${where} order by a.created_at desc`;
  return rows as unknown as AdListItem[];
}

export async function getAd(actor: Actor, id: string) {
  const scope = isAgency(actor) ? sql`true` : sql`a.client_id = ${actor.client_id}`;
  const [ad] = await sql`
    select a.*, c.name as client_name, c.color as client_color,
           aa.meta_ad_account_id, coalesce(a.page_id, aa.page_id) as resolved_page_id
    from nova.ads a
    join nova.clients c on c.id = a.client_id
    left join nova.ad_accounts aa on aa.id = a.ad_account_id
    where a.id = ${id} and ${scope} limit 1`;
  return (ad as unknown as (Ad & { client_name: string; client_color: string | null; meta_ad_account_id: string | null; resolved_page_id: string | null })) ?? null;
}

export async function listAdAccounts(actor: Actor) {
  if (!isAgency(actor)) return [];
  const rows = await sql`select id, client_id, name, page_id from nova.ad_accounts order by created_at`;
  return rows as unknown as { id: string; client_id: string; name: string | null; page_id: string | null }[];
}

export async function getClientAdAccounts(clientId: string) {
  const rows = await sql`select id, meta_ad_account_id, name, page_id, page_name from nova.ad_accounts where client_id = ${clientId} order by created_at`;
  return rows as unknown as { id: string; meta_ad_account_id: string; name: string | null; page_id: string | null; page_name: string | null }[];
}

export interface CreateAdInput {
  client_id: string;
  preset_id?: string | null;
  ad_account_id?: string | null;
  name: string;
  destination: AdDestination;
  objective: string;
  optimization_goal: string;
  cta_type: string;
  primary_text?: string | null;
  headline?: string | null;
  description_text?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  whatsapp_phone?: string | null;
  page_id?: string | null;
  daily_budget_cents: number;
  audience: AdAudience;
}

export async function createAd(actor: Actor, input: CreateAdInput): Promise<Ad> {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  // resolve ad account + page
  let adAccountId = input.ad_account_id ?? null;
  let pageId = input.page_id ?? null;
  const accounts = await getClientAdAccounts(input.client_id);
  if (!adAccountId && accounts.length) adAccountId = accounts[0].id;
  if (!pageId) pageId = accounts.find((a) => a.id === adAccountId)?.page_id ?? null;

  const [ad] = await sql`
    insert into nova.ads
      (client_id, preset_id, ad_account_id, name, status, destination, objective, optimization_goal, cta_type,
       primary_text, headline, description_text, image_url, link_url, whatsapp_phone, page_id, daily_budget_cents, audience, created_by)
    values
      (${input.client_id}, ${input.preset_id ?? null}, ${adAccountId}, ${input.name}, 'draft', ${input.destination},
       ${input.objective}, ${input.optimization_goal}, ${input.cta_type}, ${input.primary_text ?? null}, ${input.headline ?? null},
       ${input.description_text ?? null}, ${input.image_url ?? null}, ${input.link_url ?? null}, ${input.whatsapp_phone ?? null},
       ${pageId}, ${input.daily_budget_cents}, ${toJson(input.audience)}, ${actor.id})
    returning *`;
  return ad as unknown as Ad;
}

export async function setAdResult(
  id: string,
  status: AdStatus,
  result?: { meta_campaign_id?: string; meta_adset_id?: string; meta_creative_id?: string; meta_ad_id?: string },
  error?: string | null,
) {
  await sql`
    update nova.ads set
      status = ${status},
      meta_campaign_id = coalesce(${result?.meta_campaign_id ?? null}, meta_campaign_id),
      meta_adset_id = coalesce(${result?.meta_adset_id ?? null}, meta_adset_id),
      meta_creative_id = coalesce(${result?.meta_creative_id ?? null}, meta_creative_id),
      meta_ad_id = coalesce(${result?.meta_ad_id ?? null}, meta_ad_id),
      error = ${error ?? null}
    where id = ${id}`;
}

export async function deleteAd(actor: Actor, id: string) {
  if (!isAgency(actor)) throw new Error('FORBIDDEN');
  await sql`delete from nova.ads where id = ${id}`;
}
