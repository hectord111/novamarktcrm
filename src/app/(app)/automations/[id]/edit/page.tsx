import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { getAutomation } from '@/lib/data/automations';
import { listClientOptions } from '@/lib/data/clients';
import { isAgency, type AutomationAction } from '@/lib/types';
import { AutomationForm } from '@/components/automations/AutomationForm';
import { PageHeader, Card } from '@/components/ui';
import { updateAutomationAction, deleteAutomationAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');
  const { id } = await params;
  const data = await getAutomation(actor, id);
  if (!data) notFound();
  const a = data.automation;
  const clients = await listClientOptions(actor);

  const firstAction = (a.actions?.[0] ?? {}) as AutomationAction;
  const cfg = (a.trigger_config ?? {}) as { hours?: number; statuses?: string[] };

  return (
    <div className="animate-in mx-auto max-w-2xl">
      <Link href="/automations" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Volver a automatizaciones
      </Link>
      <PageHeader title="Editar automatización" subtitle={a.name} />

      <AutomationForm
        action={updateAutomationAction}
        clients={clients}
        submitLabel="Guardar cambios"
        initial={{
          id: a.id,
          name: a.name,
          description: a.description,
          client_id: a.client_id,
          trigger: a.trigger,
          body: firstAction.body,
          delay_minutes: firstAction.delay_minutes,
          hours: cfg.hours,
          statuses: cfg.statuses,
          is_active: a.is_active,
        }}
      />

      <Card className="mt-4 flex items-center justify-between p-5">
        <div>
          <div className="text-sm font-semibold text-slate-900">Eliminar automatización</div>
          <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
        </div>
        <form action={deleteAutomationAction}>
          <input type="hidden" name="id" value={a.id} />
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100">
            <Trash2 size={15} /> Eliminar
          </button>
        </form>
      </Card>
    </div>
  );
}
