import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listClientOptions } from '@/lib/data/clients';
import { listCampaigns } from '@/lib/data/campaigns';
import { isAgency } from '@/lib/types';
import { createLeadAction } from '../actions';
import { Card, PageHeader, Button, Input, Label, Select } from '@/components/ui';
import { SOURCE_LABELS } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export default async function NewLeadPage() {
  const actor = await requireActor();
  const [clients, campaigns] = await Promise.all([
    isAgency(actor) ? listClientOptions(actor) : Promise.resolve([]),
    listCampaigns(actor),
  ]);

  return (
    <div className="animate-in mx-auto max-w-2xl">
      <Link href="/leads" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Volver a leads
      </Link>
      <PageHeader title="Nuevo lead" subtitle="Crea un lead manualmente. Se dispararán las automatizaciones de bienvenida." />

      <Card className="p-6">
        <form action={createLeadAction} className="space-y-4">
          {isAgency(actor) && (
            <div>
              <Label htmlFor="client_id">Cliente *</Label>
              <Select id="client_id" name="client_id" required defaultValue="">
                <option value="" disabled>
                  Selecciona un cliente
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" name="full_name" placeholder="Ej. María García" />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" placeholder="+34 600 000 000" />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="maria@email.com" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="source">Origen</Label>
              <Select id="source" name="source" defaultValue="manual">
                {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="campaign_id">Campaña (opcional)</Label>
              <Select id="campaign_id" name="campaign_id" defaultValue="">
                <option value="">Sin campaña</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isAgency(actor) ? `${c.client_name} · ` : ''}
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button href="/leads" variant="ghost">
              Cancelar
            </Button>
            <Button type="submit">Crear lead</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
