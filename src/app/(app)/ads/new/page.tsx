import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listClientOptions } from '@/lib/data/clients';
import { listPresets, listAdAccounts } from '@/lib/data/ads';
import { isAgency } from '@/lib/types';
import { AdBuilder } from '@/components/ads/AdBuilder';
import { PageHeader, EmptyState, Button } from '@/components/ui';
import { createAdAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewAdPage() {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');
  const [clients, presets, adAccounts] = await Promise.all([listClientOptions(actor), listPresets(actor), listAdAccounts(actor)]);

  return (
    <div className="animate-in">
      <Link href="/ads" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Volver a anuncios
      </Link>
      <PageHeader title="Nuevo anuncio" subtitle="Plantilla + texto + presupuesto. Lo demás ya está preconfigurado." />

      {clients.length === 0 ? (
        <EmptyState title="Primero crea un cliente" description="Necesitas al menos un cliente para crear anuncios." action={<Button href="/clients/new">Crear cliente</Button>} />
      ) : (
        <AdBuilder action={createAdAction} clients={clients} presets={presets} adAccounts={adAccounts} />
      )}
    </div>
  );
}
