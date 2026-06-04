import Link from 'next/link';
import { Plus, Zap, MessageCircle, Clock, Play, Pencil, Info } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listAutomations, getAutomationStats } from '@/lib/data/automations';
import { isAgency } from '@/lib/types';
import { Card, PageHeader, Button, Badge, StatCard, EmptyState } from '@/components/ui';
import { AUTOMATION_TRIGGER_LABELS } from '@/lib/domain';
import { formatNumber, timeAgo } from '@/lib/format';
import { toggleAutomationAction, runFollowupsAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AutomationsPage() {
  const actor = await requireActor();
  const agency = isAgency(actor);
  const [automations, stats] = await Promise.all([listAutomations(actor), getAutomationStats(actor)]);

  return (
    <div className="animate-in">
      <PageHeader title="Automatizaciones" subtitle="Mensajes automáticos a tus leads, sin mover un dedo">
        {agency && (
          <>
            <form action={runFollowupsAction}>
              <Button type="submit" variant="outline" title="Procesar ahora los seguimientos de leads sin respuesta">
                <Play size={15} /> Procesar seguimientos
              </Button>
            </form>
            <Button href="/automations/new">
              <Plus size={16} /> Nueva automatización
            </Button>
          </>
        )}
      </PageHeader>

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
        <Info size={18} className="mt-0.5 shrink-0 text-brand-600" />
        <p>
          Cada vez que entra un lead nuevo (desde Meta o manual), la automatización de bienvenida le envía un WhatsApp
          pidiéndole que explique mejor qué necesita. Sin token configurado funciona en <strong>modo simulación</strong> (los mensajes se registran pero no se envían).
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <StatCard label="Automatizaciones" value={formatNumber(stats.total)} />
        <StatCard label="Activas" value={formatNumber(stats.active)} />
        <StatCard label="Ejecuciones" value={formatNumber(stats.total_runs)} />
      </div>

      {automations.length === 0 ? (
        <EmptyState
          icon={<Zap size={28} />}
          title="Sin automatizaciones"
          description="Crea tu primera automatización para dar la bienvenida a los leads por WhatsApp automáticamente."
          action={agency ? <Button href="/automations/new"><Plus size={16} /> Nueva automatización</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {automations.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.is_active ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Zap size={18} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{a.name}</h3>
                      <Badge tone={a.is_active ? 'green' : 'slate'}>{a.is_active ? 'Activa' : 'Pausada'}</Badge>
                    </div>
                    {a.description && <p className="mt-0.5 text-sm text-slate-500">{a.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1"><Clock size={12} /> {AUTOMATION_TRIGGER_LABELS[a.trigger] ?? a.trigger}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> WhatsApp</span>
                      <span>{formatNumber(a.run_count)} ejecuciones</span>
                      {a.last_run_at && <span>· última {timeAgo(a.last_run_at)}</span>}
                      {a.client_name && <Badge tone="violet">{a.client_name}</Badge>}
                    </div>
                  </div>
                </div>

                {agency && (
                  <div className="flex items-center gap-2">
                    <form action={toggleAutomationAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="is_active" value={(!a.is_active).toString()} />
                      <button
                        type="submit"
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${a.is_active ? 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}`}
                      >
                        {a.is_active ? 'Pausar' : 'Activar'}
                      </button>
                    </form>
                    <Button href={`/automations/${a.id}/edit`} variant="outline" size="sm">
                      <Pencil size={14} /> Editar
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
