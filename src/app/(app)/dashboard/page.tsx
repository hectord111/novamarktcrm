import Link from 'next/link';
import { Euro, Users, Target, Trophy, Building2, Repeat, UserPlus, Wallet, Plus } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import {
  resolvePeriod,
  getKpis,
  getDailySeries,
  getClientBreakdown,
  getSourceBreakdown,
  getAgencyBusiness,
  type ScopeOpts,
} from '@/lib/data/dashboard';
import { listLeads } from '@/lib/data/leads';
import { resolveAccount, listAccountOptions } from '@/lib/data/accounts';
import { isAgency } from '@/lib/types';
import { Card, CardHeader, StatCard, PageHeader, Avatar } from '@/components/ui';
import { SpendLeadsChart, Donut, BarList } from '@/components/charts';
import { StageBadge } from '@/components/app/StageBadge';
import { PeriodSelector } from '@/components/app/PeriodSelector';
import { AccountSwitcher, type AccountChoice } from '@/components/app/AccountSwitcher';
import { formatCents, formatNumber, formatPercent, timeAgo } from '@/lib/format';
import { sourceLabel } from '@/lib/domain';

export const dynamic = 'force-dynamic';

const SOURCE_COLORS = ['#0b0b0b', '#2563eb', '#0d9488', '#f59e0b', '#db2777', '#16a34a'];

function Section({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-center gap-3">
      <span className="nm-label text-ink/45">{label}</span>
      <span className="h-px flex-1 bg-ink/10" />
      {action}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ days?: string; account?: string }> }) {
  const actor = await requireActor();
  const sp = await searchParams;
  const days = [7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 30;
  const period = resolvePeriod(days);
  const agency = isAgency(actor);

  const view = await resolveAccount(actor, sp.account);
  const opts: ScopeOpts = view.mode === 'portfolio' ? { excludeClientId: view.excludeClientId } : { clientId: view.clientId };
  const recentFilter = view.mode === 'portfolio' ? { excludeClientId: view.excludeClientId ?? undefined, limit: 6 } : { clientId: view.clientId, limit: 6 };
  const showBusiness = agency && view.mode !== 'client';
  const showRevenue = view.mode !== 'nova';

  const [kpis, series, sources, recent, business, accounts] = await Promise.all([
    getKpis(actor, period, opts),
    getDailySeries(actor, period, opts),
    getSourceBreakdown(actor, period, opts),
    listLeads(actor, recentFilter),
    showBusiness ? getAgencyBusiness(actor) : Promise.resolve(null),
    agency ? listAccountOptions() : Promise.resolve([]),
  ]);
  const clients = view.mode === 'portfolio' ? await getClientBreakdown(actor, period) : [];

  const newCount = Math.max(0, kpis.leads - kpis.contacted - kpis.qualified - kpis.converted - kpis.lost);
  const funnel = [
    { label: 'Nuevo', value: newCount, color: '#0ea5e9' },
    { label: 'Contactado', value: kpis.contacted, color: '#6366f1' },
    { label: 'Cualificado', value: kpis.qualified, color: '#f59e0b' },
    { label: 'Cerrado', value: kpis.converted, color: '#10b981' },
    { label: 'Perdido', value: kpis.lost, color: '#f43f5e' },
  ].filter((s) => s.value > 0);
  const roas = kpis.spendCents > 0 ? kpis.revenueCents / kpis.spendCents : null;

  const choices: AccountChoice[] = [
    ...accounts.filter((a) => a.kind === 'internal').map((a) => ({ value: 'nova', label: 'Nova (yo)', internal: true })),
    { value: 'all', label: 'Toda la cartera' },
    ...accounts.filter((a) => a.kind === 'client').map((a) => ({ value: a.id, label: a.name })),
  ];
  const currentChoice = view.mode === 'nova' ? 'nova' : view.mode === 'portfolio' ? 'all' : view.clientId;

  const subtitle =
    view.mode === 'nova'
      ? `Tus campañas para captar clientes · últimos ${days} días`
      : view.mode === 'portfolio'
        ? `Todos tus clientes · últimos ${days} días`
        : `${view.label} · últimos ${days} días`;

  const captacionLabel = view.mode === 'nova' ? 'Tu captación de clientes' : view.mode === 'client' ? `Cómo va ${view.label}` : 'Embudo de la cartera';

  return (
    <div className="animate-in">
      <PageHeader title="Panel" subtitle={subtitle}>
        {agency && <AccountSwitcher choices={choices} current={currentChoice} />}
        <PeriodSelector current={days} />
      </PageHeader>

      {/* ===== Agency business (Nova / portfolio only) ===== */}
      {business && (
        <>
          <Section label="Tu negocio" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Clientes activos" value={formatNumber(business.activeClients)} icon={<Building2 size={18} />} hint="En tu cartera" />
            <StatCard label="Ingresos recurrentes" value={formatCents(business.mrrCents, true)} icon={<Repeat size={18} />} hint="MRR · cuotas mensuales" />
            <StatCard label="Nuevos este mes" value={formatNumber(business.newClientsThisMonth)} icon={<UserPlus size={18} />} hint="Clientes captados" />
            <StatCard label="Inversión gestionada" value={formatCents(business.managedSpend30Cents, true)} icon={<Wallet size={18} />} hint="Gasto de clientes · 30d" />
          </div>
        </>
      )}

      {/* ===== Acquisition funnel (scoped to selected account) ===== */}
      <Section
        label={captacionLabel}
        action={
          view.mode === 'nova' ? (
            <Link href="/ads/new" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-ink hover:text-ink/60">
              <Plus size={13} /> Nuevo anuncio
            </Link>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Inversión Meta" value={formatCents(kpis.spendCents)} delta={kpis.spendDelta} icon={<Euro size={18} />} hint="Gasto en anuncios" />
        <StatCard label="Leads" value={formatNumber(kpis.leads)} delta={kpis.leadsDelta} icon={<Users size={18} />} hint={view.mode === 'nova' ? 'Posibles clientes' : 'Contactos generados'} />
        <StatCard label="Coste por lead" value={kpis.cplCents !== null ? formatCents(kpis.cplCents) : '—'} delta={kpis.cplDelta} goodWhenDown icon={<Target size={18} />} hint="Inversión ÷ leads" />
        <StatCard label="Coste por cliente" value={kpis.cpaCents !== null ? formatCents(kpis.cpaCents) : '—'} icon={<Trophy size={18} />} hint="Inversión ÷ cerrados" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={view.mode === 'nova' ? 'Clientes captados' : 'Clientes cerrados'} value={formatNumber(kpis.converted)} delta={kpis.convertedDelta} hint="Leads ganados" />
        <StatCard label="Conversión" value={formatPercent(kpis.conversionRate)} hint="Cerrados ÷ leads" />
        {showRevenue && <StatCard label="Ingresos" value={formatCents(kpis.revenueCents, true)} hint="Valor de ventas cerradas" />}
        {showRevenue && <StatCard label="ROAS" value={roas !== null ? `${roas.toFixed(1)}x` : '—'} hint="Ingresos ÷ inversión" />}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Inversión y leads"
            subtitle="Evolución diaria"
            action={
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-ink/50"><span className="h-2 w-2 rounded-full bg-ink" /> Inversión</span>
                <span className="flex items-center gap-1.5 text-ink/50"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Leads</span>
              </div>
            }
          />
          <div className="p-3">
            <SpendLeadsChart data={series} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Embudo de leads" subtitle="Por estado" />
          <div className="flex items-center justify-center p-6">
            {funnel.length ? (
              <Donut segments={funnel} centerValue={formatNumber(kpis.leads)} centerLabel="leads totales" />
            ) : (
              <p className="py-10 text-sm text-ink/40">Sin datos en este periodo</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {view.mode === 'portfolio' ? (
          <Card className="lg:col-span-2">
            <CardHeader title="Rendimiento por cliente" subtitle="Coste por lead y cierres por cuenta" action={<Link href="/clients" className="text-xs font-bold uppercase tracking-wide text-ink hover:text-ink/60">Ver clientes</Link>} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                    <th className="px-5 py-2.5 font-bold">Cliente</th>
                    <th className="px-3 py-2.5 text-right font-bold">Inversión</th>
                    <th className="px-3 py-2.5 text-right font-bold">Leads</th>
                    <th className="px-3 py-2.5 text-right font-bold">CPL</th>
                    <th className="px-3 py-2.5 text-right font-bold">Cerrados</th>
                    <th className="px-5 py-2.5 text-right font-bold">CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} className="border-b border-ink/5 last:border-0 hover:bg-paper">
                      <td className="px-5 py-3">
                        <Link href={`/clients/${c.id}`} className="flex items-center gap-2.5">
                          <Avatar name={c.name} color={c.color} size={28} />
                          <div>
                            <div className="font-semibold text-ink">{c.name}</div>
                            <div className="text-xs text-ink/40">{c.industry}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink/70">{formatCents(c.spendCents, true)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink/70">{formatNumber(c.leads)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-ink">{c.cplCents !== null ? formatCents(c.cplCents) : '—'}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink/70">{formatNumber(c.converted)}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-ink">{c.cpaCents !== null ? formatCents(c.cpaCents) : '—'}</td>
                    </tr>
                  ))}
                  {!clients.length && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-ink/40">Aún no hay datos de clientes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader title="Origen de los leads" subtitle="De dónde llegan tus contactos" />
            <div className="p-6">
              {sources.length ? (
                <BarList items={sources.map((s, i) => ({ label: sourceLabel(s.source), value: s.leads, display: formatNumber(s.leads), color: SOURCE_COLORS[i % SOURCE_COLORS.length] }))} />
              ) : (
                <p className="py-8 text-center text-sm text-ink/40">Sin leads en este periodo</p>
              )}
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title={view.mode === 'nova' ? 'Tus últimos leads' : 'Últimos leads'} action={<Link href="/leads" className="text-xs font-bold uppercase tracking-wide text-ink hover:text-ink/60">Ver todos</Link>} />
          <div className="divide-y divide-ink/5">
            {recent.items.map((l) => (
              <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-paper">
                <Avatar name={l.full_name || '?'} color={l.client_color} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{l.full_name || 'Sin nombre'}</div>
                  <div className="truncate text-xs text-ink/40">{view.mode === 'portfolio' ? `${l.client_name} · ` : ''}{timeAgo(l.created_at)}</div>
                </div>
                <StageBadge status={l.status} />
              </Link>
            ))}
            {!recent.items.length && <p className="px-5 py-8 text-center text-sm text-ink/40">Sin leads todavía</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
