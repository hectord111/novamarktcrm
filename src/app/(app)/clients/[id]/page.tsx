import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, RefreshCw, Mail, Phone, Pencil } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { getClient, listClients } from '@/lib/data/clients';
import { listCampaigns } from '@/lib/data/campaigns';
import { listLeads } from '@/lib/data/leads';
import { metaConfigured } from '@/lib/meta';
import { isAgency } from '@/lib/types';
import { Card, CardHeader, PageHeader, Button, Avatar, Badge, StatCard, Input, Label, Select } from '@/components/ui';
import { StageBadge } from '@/components/app/StageBadge';
import { formatCents, formatNumber, timeAgo } from '@/lib/format';
import { updateClientAction, syncClientMetaAction } from '../actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL = { active: 'Activo', paused: 'En pausa', archived: 'Archivado' } as const;

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');
  const { id } = await params;

  const data = await getClient(actor, id);
  if (!data) notFound();
  const { client, adAccounts } = data;

  const [campaigns, recent, allClients] = await Promise.all([
    listCampaigns(actor, { clientId: id }),
    listLeads(actor, { clientId: id, limit: 6 }),
    listClients(actor),
  ]);
  const stats = allClients.find((c) => c.id === id);
  const spend = stats?.spend30_cents ?? 0;
  const leads = stats?.leads ?? 0;
  const converted = stats?.converted ?? 0;
  const cpl = leads > 0 ? Math.round(spend / leads) : null;
  const cpa = converted > 0 ? Math.round(spend / converted) : null;

  return (
    <div className="animate-in">
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Volver a clientes
      </Link>

      <Card className="mb-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={client.name} color={client.color} size={52} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900">{client.name}</h1>
                <Badge tone={client.status === 'active' ? 'green' : client.status === 'paused' ? 'amber' : 'slate'}>
                  {STATUS_LABEL[client.status]}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>{client.industry || 'Sin sector'}</span>
                {client.contact_email && <span className="inline-flex items-center gap-1"><Mail size={13} /> {client.contact_email}</span>}
                {client.contact_phone && <span className="inline-flex items-center gap-1"><Phone size={13} /> {client.contact_phone}</span>}
              </div>
            </div>
          </div>
          {adAccounts.length > 0 && (
            <form action={syncClientMetaAction}>
              <input type="hidden" name="id" value={client.id} />
              <Button type="submit" variant="outline" size="sm" title={metaConfigured() ? 'Sincronizar campañas y gasto desde Meta' : 'Configura META_ACCESS_TOKEN para sincronizar'}>
                <RefreshCw size={14} /> Sincronizar Meta
              </Button>
            </form>
          )}
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Inversión 30d" value={formatCents(spend, true)} />
        <StatCard label="Leads 30d" value={formatNumber(leads)} />
        <StatCard label="Coste por lead" value={cpl !== null ? formatCents(cpl) : '—'} />
        <StatCard label="Coste por cliente" value={cpa !== null ? formatCents(cpa) : '—'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Campañas" subtitle={`${campaigns.length} campañas · inversión últimos 30 días`} action={<Link href="/campaigns" className="text-xs font-medium text-brand-700 hover:underline">Ver todas</Link>} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Campaña</th>
                  <th className="px-3 py-2.5 text-right font-medium">Inversión</th>
                  <th className="px-3 py-2.5 text-right font-medium">Leads</th>
                  <th className="px-5 py-2.5 text-right font-medium">CPL</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const ccpl = c.leads > 0 ? Math.round(c.spend30_cents / c.leads) : null;
                  return (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{c.name}</div>
                        <Badge tone={c.status === 'active' ? 'green' : 'slate'}>{c.status}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatCents(c.spend30_cents, true)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatNumber(c.leads)}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-900">{ccpl !== null ? formatCents(ccpl) : '—'}</td>
                    </tr>
                  );
                })}
                {!campaigns.length && <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">Sin campañas todavía.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Últimos leads" action={<Link href={`/leads?client=${client.id}`} className="text-xs font-medium text-brand-700 hover:underline">Ver</Link>} />
            <div className="divide-y divide-slate-50">
              {recent.items.map((l) => (
                <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60">
                  <Avatar name={l.full_name || '?'} color={client.color} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{l.full_name || 'Sin nombre'}</div>
                    <div className="text-xs text-slate-400">{timeAgo(l.created_at)}</div>
                  </div>
                  <StageBadge status={l.status} />
                </Link>
              ))}
              {!recent.items.length && <p className="px-5 py-6 text-center text-sm text-slate-400">Sin leads.</p>}
            </div>
          </Card>

          <Card className="p-5">
            <details>
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                <Pencil size={14} /> Editar cliente
              </summary>
              <form action={updateClientAction} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={client.id} />
                <div>
                  <Label htmlFor="e_name">Nombre</Label>
                  <Input id="e_name" name="name" defaultValue={client.name} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="e_industry">Sector</Label>
                    <Input id="e_industry" name="industry" defaultValue={client.industry ?? ''} />
                  </div>
                  <div>
                    <Label htmlFor="e_status">Estado</Label>
                    <Select id="e_status" name="status" defaultValue={client.status}>
                      <option value="active">Activo</option>
                      <option value="paused">En pausa</option>
                      <option value="archived">Archivado</option>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="e_email">Email</Label>
                    <Input id="e_email" name="contact_email" defaultValue={client.contact_email ?? ''} />
                  </div>
                  <div>
                    <Label htmlFor="e_phone">Teléfono</Label>
                    <Input id="e_phone" name="contact_phone" defaultValue={client.contact_phone ?? ''} />
                  </div>
                </div>
                <input type="hidden" name="contact_name" value={client.contact_name ?? ''} />
                <input type="hidden" name="color" value={client.color ?? '#7c3aed'} />
                <div>
                  <Label htmlFor="e_fee">Cuota mensual (€)</Label>
                  <Input id="e_fee" name="monthly_fee_eur" type="number" step="0.01" defaultValue={(client.monthly_fee_cents / 100).toString()} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </details>
          </Card>
        </div>
      </div>
    </div>
  );
}
