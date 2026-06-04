import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listLeads } from '@/lib/data/leads';
import { PageHeader, Button, Avatar } from '@/components/ui';
import { LEAD_STAGES } from '@/lib/domain';
import { formatCents, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { isAgency } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const actor = await requireActor();
  const columns = await Promise.all(
    LEAD_STAGES.map(async (stage) => {
      const { items, total } = await listLeads(actor, { status: stage.value, limit: 50 });
      return { stage, items, total };
    }),
  );

  return (
    <div className="animate-in">
      <PageHeader title="Pipeline" subtitle="Tus leads organizados por estado">
        <Button href="/leads/new">
          <Plus size={16} /> Nuevo lead
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {columns.map(({ stage, items, total }) => (
          <div key={stage.value} className="flex flex-col rounded-xl bg-slate-100/70 p-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <span className={cn('h-2 w-2 rounded-full', stage.dot)} />
                {stage.label}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{total}</span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto px-0.5 pt-1" style={{ maxHeight: '70vh' }}>
              {items.map((l) => (
                <Link
                  key={l.id}
                  href={`/leads/${l.id}`}
                  className="rounded-lg border border-slate-200/70 bg-white p-3 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={l.full_name || '?'} color={l.client_color} size={26} />
                    <span className="truncate text-sm font-medium text-slate-900">{l.full_name || 'Sin nombre'}</span>
                  </div>
                  {isAgency(actor) && <div className="mt-1.5 truncate text-xs text-slate-400">{l.client_name}</div>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{timeAgo(l.created_at)}</span>
                    {l.status === 'converted' && l.value_cents ? (
                      <span className="text-xs font-semibold text-emerald-600">{formatCents(l.value_cents, true)}</span>
                    ) : null}
                  </div>
                </Link>
              ))}
              {!items.length && <p className="px-2 py-6 text-center text-xs text-slate-400">Vacío</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
