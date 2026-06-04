import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listClientOptions } from '@/lib/data/clients';
import { isAgency } from '@/lib/types';
import { createCampaignAction } from '../actions';
import { Card, PageHeader, Button, Input, Label, Select } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function NewCampaignPage() {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');
  const clients = await listClientOptions(actor);

  return (
    <div className="animate-in mx-auto max-w-2xl">
      <Link href="/campaigns" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Volver a campañas
      </Link>
      <PageHeader title="Nueva campaña" subtitle="Registra una campaña manualmente o sincronízala luego desde Meta" />

      <Card className="p-6">
        <form action={createCampaignAction} className="space-y-4">
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

          <div>
            <Label htmlFor="name">Nombre de la campaña *</Label>
            <Input id="name" name="name" required placeholder="Ej. [Inmo] Compradores Costa Blanca" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="channel">Canal</Label>
              <Select id="channel" name="channel" defaultValue="meta">
                <option value="meta">Meta (FB/IG)</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="tiktok">TikTok</option>
                <option value="other">Otro</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select id="status" name="status" defaultValue="active">
                <option value="active">Activa</option>
                <option value="paused">En pausa</option>
                <option value="draft">Borrador</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="objective">Objetivo</Label>
              <Input id="objective" name="objective" defaultValue="OUTCOME_LEADS" />
            </div>
            <div>
              <Label htmlFor="daily_budget_eur">Presupuesto diario (€)</Label>
              <Input id="daily_budget_eur" name="daily_budget_eur" type="number" step="0.01" min="0" placeholder="20,00" />
            </div>
          </div>

          <div>
            <Label htmlFor="meta_campaign_id">ID de campaña en Meta (opcional)</Label>
            <Input id="meta_campaign_id" name="meta_campaign_id" placeholder="120xxxxxxxxxxx" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button href="/campaigns" variant="ghost">
              Cancelar
            </Button>
            <Button type="submit">Crear campaña</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
