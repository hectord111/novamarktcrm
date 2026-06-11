import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Radar, Globe, ExternalLink, Plus } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { isAgency } from '@/lib/types';
import { listProspects, countProspectsByStatus, type ProspectStatus } from '@/lib/data/prospects';
import { placesConfigured } from '@/lib/places';
import { Card, PageHeader, Badge, Button, Input, EmptyState } from '@/components/ui';
import { ProspectSearch } from '@/components/prospecting/ProspectSearch';
import { addManualProspectAction } from './actions';
import { PROSPECT_STAGES } from '@/lib/domain';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProspectingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');
  const sp = await searchParams;
  const statusFilter = PROSPECT_STAGES.find((s) => s.value === sp.status)?.value as ProspectStatus | undefined;

  const [prospects, counts] = await Promise.all([
    listProspects(actor, { status: statusFilter }),
    countProspectsByStatus(actor),
  ]);
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="animate-in">
      <PageHeader
        title="Prospección"
        subtitle="Encuentra negocios sin web, genera su landing de muestra y mándasela por WhatsApp"
      />

      <ProspectSearch configured={placesConfigured()} />

      {/* Manual add */}
      <details className="mt-3 rounded-lg border-2 border-ink/10 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink/60 hover:text-ink">
          <Plus size={12} className="mr-1 inline" /> Añadir negocio a mano
        </summary>
        <form action={addManualProspectAction} className="flex flex-col gap-2 border-t-2 border-ink/10 p-4 sm:flex-row">
          <Input name="business_name" required placeholder="Nombre del negocio *" />
          <Input name="sector" placeholder="Sector — ej. peluquería" className="sm:w-44" />
          <Input name="city" placeholder="Ciudad" className="sm:w-36" />
          <Input name="phone" placeholder="Teléfono" className="sm:w-40" />
          <Button type="submit" variant="outline">Añadir</Button>
        </form>
      </details>

      {/* Status tabs */}
      <div className="mb-4 mt-5 flex flex-wrap items-center gap-1.5">
        <Link
          href="/prospecting"
          className={cn(
            'rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide ring-1 ring-inset',
            !statusFilter ? 'bg-ink text-white ring-ink' : 'bg-white text-ink/60 ring-ink/15 hover:bg-paper',
          )}
        >
          Todos <span className="ml-1 opacity-60">{totalAll}</span>
        </Link>
        {PROSPECT_STAGES.map((s) => (
          <Link
            key={s.value}
            href={`/prospecting?status=${s.value}`}
            className={cn(
              'rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide ring-1 ring-inset transition-colors',
              statusFilter === s.value ? 'bg-ink text-white ring-ink' : 'bg-white text-ink/60 ring-ink/15 hover:bg-paper',
            )}
          >
            {s.label} <span className="ml-1 opacity-60">{counts[s.value] ?? 0}</span>
          </Link>
        ))}
      </div>

      {prospects.length === 0 ? (
        <EmptyState
          icon={<Radar size={28} />}
          title={statusFilter ? 'Nada en este estado' : 'Aún no tienes prospectos'}
          description="Busca un sector y una ciudad arriba: los negocios sin web entran aquí con su landing de muestra generada automáticamente."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                  <th className="px-5 py-3 font-bold">Negocio</th>
                  <th className="px-3 py-3 font-bold">Teléfono</th>
                  <th className="px-3 py-3 font-bold">Web propia</th>
                  <th className="px-3 py-3 font-bold">Landing de muestra</th>
                  <th className="px-3 py-3 font-bold">Estado</th>
                  <th className="px-5 py-3 text-right font-bold">Entró</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => {
                  const stage = PROSPECT_STAGES.find((s) => s.value === p.status) ?? PROSPECT_STAGES[0];
                  return (
                    <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-paper">
                      <td className="px-5 py-3">
                        <Link href={`/prospecting/${p.id}`} className="block">
                          <div className="flex items-center gap-2 font-semibold text-ink">
                            <span aria-hidden>{p.landing?.emoji ?? '⭐'}</span> {p.business_name}
                          </div>
                          <div className="text-xs text-ink/40">
                            {[p.sector, p.city].filter(Boolean).join(' · ')}
                            {p.rating != null && ` · ★ ${Number(p.rating).toLocaleString('es-ES', { minimumFractionDigits: 1 })}`}
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-ink/60">{p.phone ?? <span className="text-ink/30">—</span>}</td>
                      <td className="px-3 py-3">
                        {p.has_website ? <Badge tone="slate"><Globe size={11} /> Tiene</Badge> : <Badge tone="brand">Sin web 🎯</Badge>}
                      </td>
                      <td className="px-3 py-3">
                        {p.landing_slug && (
                          <a href={`/l/${p.landing_slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-ink underline decoration-yellow decoration-2 underline-offset-2 hover:decoration-ink">
                            Ver landing <ExternalLink size={11} />
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-3"><Badge tone={stage.tone}>{stage.label}</Badge></td>
                      <td className="px-5 py-3 text-right text-xs text-ink/40">{timeAgo(p.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
