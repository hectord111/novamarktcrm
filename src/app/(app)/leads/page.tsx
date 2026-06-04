import Link from 'next/link';
import { Plus, Search, Mail, Phone } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listLeads, countLeadsByStatus, type LeadFilters } from '@/lib/data/leads';
import { listClientOptions } from '@/lib/data/clients';
import { isAgency, type LeadStatus } from '@/lib/types';
import { Card, PageHeader, Button, Avatar, Badge, Input, Select, EmptyState } from '@/components/ui';
import { StageBadge } from '@/components/app/StageBadge';
import { LEAD_STAGES, sourceLabel, SOURCE_LABELS } from '@/lib/domain';
import { formatCents, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

type SP = { status?: string; client?: string; source?: string; q?: string; page?: string };

function buildHref(cur: SP, override: Partial<SP>) {
  const merged = { ...cur, ...override };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, String(v));
  const s = sp.toString();
  return `/leads${s ? `?${s}` : ''}`;
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireActor();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const statusFilter = LEAD_STAGES.find((s) => s.value === sp.status)?.value as LeadStatus | undefined;

  const filters: LeadFilters = {
    status: statusFilter,
    clientId: sp.client || undefined,
    source: sp.source || undefined,
    search: sp.q || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const [{ items, total }, counts, clientOptions] = await Promise.all([
    listLeads(actor, filters),
    countLeadsByStatus(actor, { clientId: sp.client || undefined, search: sp.q || undefined }),
    isAgency(actor) ? listClientOptions(actor) : Promise.resolve([]),
  ]);

  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="animate-in">
      <PageHeader title="Leads" subtitle={`${total} ${total === 1 ? 'lead' : 'leads'}${statusFilter ? ' en este estado' : ''}`}>
        <Button href="/leads/new">
          <Plus size={16} /> Nuevo lead
        </Button>
      </PageHeader>

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <Link
          href={buildHref(sp, { status: undefined, page: undefined })}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset',
            !statusFilter ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
          )}
        >
          Todos <span className="ml-1 opacity-60">{totalAll}</span>
        </Link>
        {LEAD_STAGES.map((s) => (
          <Link
            key={s.value}
            href={buildHref(sp, { status: s.value, page: undefined })}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors',
              statusFilter === s.value ? `${s.color} ring-current` : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {s.label} <span className="ml-1 opacity-60">{counts[s.value] ?? 0}</span>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <form method="get" action="/leads" className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input name="q" defaultValue={sp.q} placeholder="Buscar por nombre, email o teléfono…" className="pl-9" />
        </div>
        {isAgency(actor) && (
          <Select name="client" defaultValue={sp.client || ''} className="sm:w-48">
            <option value="">Todos los clientes</option>
            {clientOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
        <Select name="source" defaultValue={sp.source || ''} className="sm:w-44">
          <option value="">Todos los orígenes</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="No hay leads que coincidan"
          description="Prueba a cambiar los filtros o crea un lead manualmente. Los leads de Meta entran automáticamente por el webhook."
          action={<Button href="/leads/new"><Plus size={16} /> Nuevo lead</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Lead</th>
                  {isAgency(actor) && <th className="px-3 py-3 font-medium">Cliente</th>}
                  <th className="px-3 py-3 font-medium">Campaña</th>
                  <th className="px-3 py-3 font-medium">Origen</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Entró</th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/leads/${l.id}`} className="flex items-center gap-3">
                        <Avatar name={l.full_name || '?'} color={l.client_color} size={34} />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">{l.full_name || 'Sin nombre'}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            {l.email && <span className="inline-flex items-center gap-1"><Mail size={11} />{l.email}</span>}
                            {l.phone && <span className="inline-flex items-center gap-1"><Phone size={11} />{l.phone}</span>}
                          </div>
                        </div>
                      </Link>
                    </td>
                    {isAgency(actor) && (
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <span className="h-2 w-2 rounded-full" style={{ background: l.client_color || '#7c3aed' }} />
                          {l.client_name}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-3 text-slate-500">{l.campaign_name || '—'}</td>
                    <td className="px-3 py-3">
                      <Badge tone="slate">{sourceLabel(l.source)}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <StageBadge status={l.status} />
                      {l.status === 'converted' && l.value_cents ? (
                        <span className="ml-2 text-xs font-medium text-emerald-600">{formatCents(l.value_cents, true)}</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-slate-400">{timeAgo(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && <Button variant="outline" size="sm" href={buildHref(sp, { page: String(page - 1) })}>Anterior</Button>}
            {page < totalPages && <Button variant="outline" size="sm" href={buildHref(sp, { page: String(page + 1) })}>Siguiente</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
