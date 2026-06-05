import 'server-only';
import { sql } from '../db';
import { isAgency, type Actor } from '../types';

/** Optional account scoping: restrict to one client, or exclude one (e.g. the internal Nova account). */
export interface ScopeOpts {
  clientId?: string | null;
  excludeClientId?: string | null;
}

function leadScopeSql(actor: Actor, o: ScopeOpts = {}) {
  if (!isAgency(actor)) return actor.client_id ? sql`l.client_id = ${actor.client_id}` : sql`false`;
  if (o.clientId) return sql`l.client_id = ${o.clientId}`;
  if (o.excludeClientId) return sql`l.client_id <> ${o.excludeClientId}`;
  return sql`true`;
}

function spendScopeSql(actor: Actor, o: ScopeOpts = {}) {
  if (!isAgency(actor)) return actor.client_id ? sql`c.client_id = ${actor.client_id}` : sql`false`;
  if (o.clientId) return sql`c.client_id = ${o.clientId}`;
  if (o.excludeClientId) return sql`c.client_id <> ${o.excludeClientId}`;
  return sql`true`;
}


function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export interface Period {
  days: number;
  from: string; // inclusive YYYY-MM-DD
  to: string; // inclusive YYYY-MM-DD
  toExclusive: string; // to + 1 day
  prevFrom: string;
  prevToExclusive: string;
}

export function resolvePeriod(days: number): Period {
  const today = new Date();
  const from = addDays(today, -(days - 1));
  const prevFrom = addDays(from, -days);
  return {
    days,
    from: isoDate(from),
    to: isoDate(today),
    toExclusive: isoDate(addDays(today, 1)),
    prevFrom: isoDate(prevFrom),
    prevToExclusive: isoDate(from),
  };
}

export interface Kpis {
  spendCents: number;
  leads: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
  revenueCents: number;
  cplCents: number | null; // cost per lead
  cpaCents: number | null; // cost per closed client
  conversionRate: number | null;
  // deltas vs previous period (ratio change, e.g. 0.12 = +12%)
  spendDelta: number | null;
  leadsDelta: number | null;
  cplDelta: number | null;
  convertedDelta: number | null;
}

async function rawTotals(actor: Actor, from: string, toExclusive: string, fromD: string, toD: string, o: ScopeOpts = {}) {
  const leadScope = leadScopeSql(actor, o);
  const spendScope = spendScopeSql(actor, o);

  const [leadAgg] = await sql`
    select
      count(*)::int                                                  as leads,
      count(*) filter (where status = 'contacted')::int             as contacted,
      count(*) filter (where status = 'qualified')::int             as qualified,
      count(*) filter (where status = 'converted')::int             as converted,
      count(*) filter (where status = 'lost')::int                  as lost,
      coalesce(sum(value_cents) filter (where status = 'converted'), 0)::int as revenue
    from nova.leads l
    where ${leadScope} and l.created_at >= ${from} and l.created_at < ${toExclusive}`;

  const [{ spend }] = await sql`
    select coalesce(sum(m.spend_cents), 0)::int as spend
    from nova.campaign_metrics m
    join nova.campaigns c on c.id = m.campaign_id
    where ${spendScope} and m.date >= ${fromD} and m.date <= ${toD}`;

  return { ...leadAgg, spend } as {
    leads: number; contacted: number; qualified: number; converted: number; lost: number; revenue: number; spend: number;
  };
}

export async function getKpis(actor: Actor, period: Period, o: ScopeOpts = {}): Promise<Kpis> {
  const cur = await rawTotals(actor, period.from, period.toExclusive, period.from, period.to, o);
  const prev = await rawTotals(actor, period.prevFrom, period.prevToExclusive, period.prevFrom, period.from, o);

  const cpl = cur.leads > 0 ? Math.round(cur.spend / cur.leads) : null;
  const prevCpl = prev.leads > 0 ? prev.spend / prev.leads : null;
  const cpa = cur.converted > 0 ? Math.round(cur.spend / cur.converted) : null;

  const delta = (a: number, b: number) => (b > 0 ? (a - b) / b : a > 0 ? 1 : null);

  return {
    spendCents: cur.spend,
    leads: cur.leads,
    contacted: cur.contacted,
    qualified: cur.qualified,
    converted: cur.converted,
    lost: cur.lost,
    revenueCents: cur.revenue,
    cplCents: cpl,
    cpaCents: cpa,
    conversionRate: cur.leads > 0 ? cur.converted / cur.leads : null,
    spendDelta: delta(cur.spend, prev.spend),
    leadsDelta: delta(cur.leads, prev.leads),
    cplDelta: cpl !== null && prevCpl ? (cpl - prevCpl) / prevCpl : null,
    convertedDelta: delta(cur.converted, prev.converted),
  };
}

export interface DayPoint {
  date: string;
  spendCents: number;
  leads: number;
}

export async function getDailySeries(actor: Actor, period: Period, o: ScopeOpts = {}): Promise<DayPoint[]> {
  const leadScope = leadScopeSql(actor, o);
  const spendScope = spendScopeSql(actor, o);
  const rows = await sql`
    select to_char(d::date, 'YYYY-MM-DD') as date,
           coalesce(s.spend, 0)::int as spend_cents,
           coalesce(lc.leads, 0)::int as leads
    from generate_series(${period.from}::date, ${period.to}::date, interval '1 day') d
    left join (
      select m.date, sum(m.spend_cents) as spend
      from nova.campaign_metrics m join nova.campaigns c on c.id = m.campaign_id
      where ${spendScope} group by m.date
    ) s on s.date = d::date
    left join (
      select date_trunc('day', l.created_at)::date as date, count(*) as leads
      from nova.leads l where ${leadScope} group by 1
    ) lc on lc.date = d::date
    order by d`;
  return rows.map((r) => ({ date: r.date, spendCents: r.spend_cents, leads: r.leads }));
}

export interface ClientBreakdownRow {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  industry: string | null;
  spendCents: number;
  leads: number;
  converted: number;
  revenueCents: number;
  cplCents: number | null;
  cpaCents: number | null;
}

export async function getClientBreakdown(actor: Actor, period: Period): Promise<ClientBreakdownRow[]> {
  const clientScope = isAgency(actor) ? sql`c.status <> 'archived' and c.kind = 'client'` : sql`c.id = ${actor.client_id}`;
  const rows = await sql`
    select c.id, c.name, c.slug, c.color, c.industry,
           coalesce(sp.spend, 0)::int     as spend_cents,
           coalesce(ld.leads, 0)::int     as leads,
           coalesce(ld.converted, 0)::int as converted,
           coalesce(ld.revenue, 0)::int   as revenue_cents
    from nova.clients c
    left join (
      select c2.client_id, sum(m.spend_cents) as spend
      from nova.campaign_metrics m join nova.campaigns c2 on c2.id = m.campaign_id
      where m.date >= ${period.from} and m.date <= ${period.to}
      group by c2.client_id
    ) sp on sp.client_id = c.id
    left join (
      select l.client_id, count(*) as leads,
             count(*) filter (where status = 'converted') as converted,
             sum(value_cents) filter (where status = 'converted') as revenue
      from nova.leads l
      where l.created_at >= ${period.from} and l.created_at < ${period.toExclusive}
      group by l.client_id
    ) ld on ld.client_id = c.id
    where ${clientScope}
    order by spend_cents desc, leads desc`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    color: r.color,
    industry: r.industry,
    spendCents: r.spend_cents,
    leads: r.leads,
    converted: r.converted,
    revenueCents: r.revenue_cents,
    cplCents: r.leads > 0 ? Math.round(r.spend_cents / r.leads) : null,
    cpaCents: r.converted > 0 ? Math.round(r.spend_cents / r.converted) : null,
  }));
}

export async function getSourceBreakdown(actor: Actor, period: Period, o: ScopeOpts = {}) {
  const leadScope = leadScopeSql(actor, o);
  const rows = await sql`
    select source, count(*)::int as leads
    from nova.leads l
    where ${leadScope} and l.created_at >= ${period.from} and l.created_at < ${period.toExclusive}
    group by source order by leads desc`;
  return rows.map((r) => ({ source: r.source as string, leads: r.leads as number }));
}

export interface AgencyBusiness {
  activeClients: number;
  mrrCents: number;
  newClientsThisMonth: number;
  managedSpend30Cents: number;
}

/** Cross-portfolio health of the agency itself (excludes the internal Nova account). */
export async function getAgencyBusiness(actor: Actor): Promise<AgencyBusiness> {
  if (!isAgency(actor)) return { activeClients: 0, mrrCents: 0, newClientsThisMonth: 0, managedSpend30Cents: 0 };
  const [biz] = await sql`
    select
      count(*) filter (where status = 'active')::int                                          as active_clients,
      coalesce(sum(monthly_fee_cents) filter (where status = 'active'), 0)::int                as mrr_cents,
      count(*) filter (where created_at >= date_trunc('month', now()))::int                    as new_this_month
    from nova.clients
    where kind = 'client'`;
  const [{ spend }] = await sql`
    select coalesce(sum(m.spend_cents), 0)::int as spend
    from nova.campaign_metrics m
    join nova.campaigns c on c.id = m.campaign_id
    join nova.clients cl on cl.id = c.client_id
    where cl.kind = 'client' and m.date >= current_date - 29`;
  return {
    activeClients: biz.active_clients,
    mrrCents: biz.mrr_cents,
    newClientsThisMonth: biz.new_this_month,
    managedSpend30Cents: spend,
  };
}
