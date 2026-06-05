import Link from 'next/link';
import { Euro, Users, Target, Trophy } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { resolvePeriod, getKpis, getDailySeries, getClientBreakdown, getSourceBreakdown } from '@/lib/data/dashboard';
import { listLeads } from '@/lib/data/leads';
import { isAgency } from '@/lib/types';
import { Card, CardHeader, StatCard, PageHeader, Avatar } from '@/components/ui';
import { SpendLeadsChart, Donut, BarList } from '@/components/charts';
import { StageBadge } from '@/components/app/StageBadge';
import { PeriodSelector } from '@/components/app/PeriodSelector';
import { formatCents, formatNumber, formatPercent, timeAgo } from '@/lib/format';
import { colorFromString } from '@/lib/utils';
import { sourceLabel } from '@/lib/domain';

export const dynamic = 'force-dynamic';

const SOURCE_COLORS = ['#0b0b0b', '#2563eb', '#0d9488', '#f59e0b', '#db2777', '#16a34a'];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const actor = await requireActor();
  const sp = await searchParams;
  const days = [7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 30;
  const period = resolvePeriod(days);

  const [kpis, series, clients, sources, recent] = await Promise.all([
    getKpis(actor, period),
    getDailySeries(actor, period),
    getClientBreakdown(actor, period),
    getSourceBreakdown(actor, period),
    listLeads(actor, { limit: 6 }),
  ]);

  const newCount = Math.max(0, kpis.leads - kpis.contacted - kpis.qualified - kpis.converted - kpis.lost);
  const funnel = [
    { label: 'Nuevo', value: newCount, color: '#0ea5e9' },
    { label: 'Contactado', value: kpis.contacted, color: '#8b5cf6' },
    { label: 'Cualificado', value: kpis.qualified, color: '#f59e0b' },
    { label: 'Cerrado', value: kpis.converted, color: '#10b981' },
    { label: 'Perdido', value: kpis.lost, color: '#f43f5e' },
  ].filter((s) => s.value > 0);

  const roas = kpis.spendCents > 0 ? kpis.revenueCents / kpis.spendCents : null;

  return (
    <div className="animate-in">
      <PageHeader title="Panel" subtitle={`Resumen de los últimos ${days} días`}>
        <PeriodSelector current={days} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Inversión Meta" value={formatCents(kpis.spendCents)} delta={kpis.spendDelta} icon={<Euro size={18} />} hint="Gasto en anuncios" />
        <StatCard label="Leads" value={formatNumber(kpis.leads)} delta={kpis.leadsDelta} icon={<Users size={18} />} hint="Contactos generados" />
        <StatCard label="Coste por lead" value={kpis.cplCents !== null ? formatCents(kpis.cplCents) : '—'} delta={kpis.cplDelta} goodWhenDown icon={<Target size={18} />} hint="Inversión ÷ leads" />
        <StatCard label="Coste por cliente" value={kpis.cpaCents !== null ? formatCents(kpis.cpaCents) : '—'} icon={<Trophy size={18} />} hint="Inversión ÷ cerrados" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clientes cerrados" value={formatNumber(kpis.converted)} delta={kpis.convertedDelta} hint="Leads ganados" />
        <StatCard label="Conversión" value={formatPercent(kpis.conversionRate)} hint="Cerrados ÷ leads" />
        <StatCard label="Ingresos" value={formatCents(kpis.revenueCents, true)} hint="Valor de ventas cerradas" />
        <StatCard label="ROAS" value={roas !== null ? `${roas.toFixed(1)}x` : '—'} hint="Ingresos ÷ inversión" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Inversión y leads"
            subtitle="Evolución diaria"
            action={
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-full bg-brand-600" /> Inversión</span>
                <span className="flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Leads</span>
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
              <p className="py-10 text-sm text-slate-400">Sin datos en este periodo</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {isAgency(actor) ? (
          <Card className="lg:col-span-2">
            <CardHeader title="Rendimiento por cliente" subtitle="Coste por lead y cierres por cuenta" action={<Link href="/clients" className="text-xs font-medium text-brand-700 hover:underline">Ver clientes</Link>} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-2.5 font-medium">Cliente</th>
                    <th className="px-3 py-2.5 text-right font-medium">Inversión</th>
                    <th className="px-3 py-2.5 text-right font-medium">Leads</th>
                    <th className="px-3 py-2.5 text-right font-medium">CPL</th>
                    <th className="px-3 py-2.5 text-right font-medium">Cerrados</th>
                    <th className="px-5 py-2.5 text-right font-medium">CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link href={`/clients/${c.id}`} className="flex items-center gap-2.5">
                          <Avatar name={c.name} color={c.color} size={28} />
                          <div>
                            <div className="font-medium text-slate-900">{c.name}</div>
                            <div className="text-xs text-slate-400">{c.industry}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatCents(c.spendCents, true)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatNumber(c.leads)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-900">{c.cplCents !== null ? formatCents(c.cplCents) : '—'}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatNumber(c.converted)}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-900">{c.cpaCents !== null ? formatCents(c.cpaCents) : '—'}</td>
                    </tr>
                  ))}
                  {!clients.length && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">Aún no hay datos de clientes.</td></tr>
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
                <p className="py-8 text-center text-sm text-slate-400">Sin leads en este periodo</p>
              )}
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Últimos leads" action={<Link href="/leads" className="text-xs font-medium text-brand-700 hover:underline">Ver todos</Link>} />
          <div className="divide-y divide-slate-50">
            {recent.items.map((l) => (
              <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60">
                <Avatar name={l.full_name || '?'} color={l.client_color} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{l.full_name || 'Sin nombre'}</div>
                  <div className="truncate text-xs text-slate-400">{l.client_name} · {timeAgo(l.created_at)}</div>
                </div>
                <StageBadge status={l.status} />
              </Link>
            ))}
            {!recent.items.length && <p className="px-5 py-8 text-center text-sm text-slate-400">Sin leads todavía</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
