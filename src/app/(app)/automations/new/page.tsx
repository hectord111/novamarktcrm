import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listClientOptions } from '@/lib/data/clients';
import { isAgency } from '@/lib/types';
import { AutomationForm } from '@/components/automations/AutomationForm';
import { PageHeader } from '@/components/ui';
import { createAutomationAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewAutomationPage() {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');
  const clients = await listClientOptions(actor);

  return (
    <div className="animate-in mx-auto max-w-2xl">
      <Link href="/automations" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Volver a automatizaciones
      </Link>
      <PageHeader title="Nueva automatización" subtitle="Envía un mensaje automático a tus leads" />
      <AutomationForm action={createAutomationAction} clients={clients} submitLabel="Crear automatización" />
    </div>
  );
}
