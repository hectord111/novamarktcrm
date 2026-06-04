import 'server-only';
import { sql } from './db';

const GRAPH = 'https://graph.facebook.com/v21.0';

export function metaConfigured() {
  return Boolean(process.env.META_ACCESS_TOKEN);
}

async function graph<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN no configurada');
  const url = new URL(`${GRAPH}/${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { cache: 'no-store' });
  const json = (await res.json()) as { error?: { message: string } } & T;
  if (!res.ok || json.error) throw new Error(json.error?.message || `Graph API ${res.status}`);
  return json;
}

function eurToCents(spend: string | number | undefined) {
  return Math.round(Number(spend ?? 0) * 100);
}

interface InsightRow {
  campaign_id: string;
  campaign_name: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  date_start: string;
  actions?: { action_type: string; value: string }[];
}

function leadsFromActions(actions?: { action_type: string; value: string }[]) {
  if (!actions) return 0;
  const lead = actions.find(
    (a) => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped' || a.action_type === 'leadgen.other',
  );
  return lead ? Number(lead.value) : 0;
}

/**
 * Pull campaigns and the last `days` of daily insights from Meta for every ad
 * account linked to a client, upserting into nova.campaigns / nova.campaign_metrics.
 */
export async function syncMetaForClient(clientId: string, days = 30) {
  const adAccounts = (await sql`
    select id, meta_ad_account_id from nova.ad_accounts where client_id = ${clientId}`) as unknown as {
    id: string;
    meta_ad_account_id: string;
  }[];
  if (!adAccounts.length) return { ok: false, reason: 'Este cliente no tiene cuentas publicitarias de Meta vinculadas.' };

  let campaignsUpserted = 0;
  let metricRows = 0;
  const errors: string[] = [];

  for (const acc of adAccounts) {
    const act = `act_${acc.meta_ad_account_id}`;
    try {
      const camps = await graph<{ data: { id: string; name: string; objective?: string; status?: string }[] }>(
        `${act}/campaigns`,
        { fields: 'id,name,objective,status', limit: '200' },
      );
      const idMap = new Map<string, string>();
      for (const c of camps.data) {
        const [row] = await sql`
          insert into nova.campaigns (client_id, ad_account_id, meta_campaign_id, name, objective, channel, status)
          values (${clientId}, ${acc.id}, ${c.id}, ${c.name}, ${c.objective ?? null}, 'meta',
                  ${c.status === 'ACTIVE' ? 'active' : c.status === 'PAUSED' ? 'paused' : 'ended'})
          on conflict (meta_campaign_id) where meta_campaign_id is not null
          do update set name = excluded.name, objective = excluded.objective, status = excluded.status, ad_account_id = excluded.ad_account_id
          returning id`;
        if (row) {
          idMap.set(c.id, row.id);
          campaignsUpserted++;
        }
      }

      const insights = await graph<{ data: InsightRow[] }>(`${act}/insights`, {
        level: 'campaign',
        fields: 'campaign_id,campaign_name,spend,impressions,clicks,actions',
        time_increment: '1',
        date_preset: days <= 7 ? 'last_7d' : days <= 30 ? 'last_30d' : 'last_90d',
        limit: '500',
      });
      for (const row of insights.data) {
        const campaignId = idMap.get(row.campaign_id);
        if (!campaignId) continue;
        await sql`
          insert into nova.campaign_metrics (campaign_id, date, spend_cents, impressions, clicks, leads_count)
          values (${campaignId}, ${row.date_start}, ${eurToCents(row.spend)}, ${Number(row.impressions ?? 0)},
                  ${Number(row.clicks ?? 0)}, ${leadsFromActions(row.actions)})
          on conflict (campaign_id, date)
          do update set spend_cents = excluded.spend_cents, impressions = excluded.impressions,
                        clicks = excluded.clicks, leads_count = excluded.leads_count`;
        metricRows++;
      }
    } catch (e) {
      errors.push(`${act}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { ok: errors.length === 0, campaignsUpserted, metricRows, errors };
}
