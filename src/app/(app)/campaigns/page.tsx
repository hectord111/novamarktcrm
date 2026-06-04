import Link from 'next/link';
import { Plus, RefreshCw, Pause, Play } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listCampaigns } from '@/lib/data/campaigns';
import { metaConfigured } from '@/lib/meta';
import { isAgency } from '@/lib/types';
import { Card, PageHeader, Button, Badge, EmptyState } from '@/components/ui';
import { formatCents, formatNumber } from '@/lib/format';
import { toggleCampaignStatusAction, syncAllMetaAction } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_TONE = { active: 'green', paused: 'amber', ended: 'slate', draft: 'sky' } as const;

export default async function CampaignsPage() {
  const actor = await requireActor();
  const campaigns = await listCampaigns(actor);
  const totalSpend = campaigns.reduce((a, c) => a + c.spend30_cents, 0);
  const totalLeads = campaigns.reduce((a, c) => a + c.leads, 0);

  return (
    <div className="animate-in">
      <PageHeader title="Campañas" subtitle={`Inversión 30 días: ${formatCents(totalSpend, true)} · ${formatNumber(totalLeads)} leads`}>
        {isAgency(actor) && (
          <>
            <form action={syncAllMetaAction}>
              <Button type="submit" variant="outline" title={metaConfigured() ? 'Sincronizar desde Meta' : 'Configura META_ACCESS_TOKEN para sincronizar datos reales'}>
                <RefreshCw size={15} /> Sincronizar Meta
              </Button>
            </form>
            <Button href="/campaigns/new">
              <Plus size={16} /> Nueva campaña
            </Button>
          </>
        )}
      </PageHeader>

      {campaigns.length === 0 ? (
        <EmptyState
          title="Sin campañas todavía"
          description="Crea una campaña o sincroniza tus campañas reales desde Meta Ads."
          action={isAgency(actor) ? <Button href="/campaigns/new"><Plus size={16} /> Nueva campaña</Button> : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Campaña</th>
                  {isAgency(actor) && <th className="px-3 py-3 font-medium">Cliente</th>}
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-3 py-3 text-right font-medium">Inversión 30d</th>
                  <th className="px-3 py-3 text-right font-medium">Leads</th>
                  <th className="px-3 py-3 text-right font-medium">CPL</th>
                  <th className="px-3 py-3 text-right font-medium">Cerrados</th>
                  {isAgency(actor) && <th className="px-5 py-3 text-right font-medium"></th>}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const cpl = c.leads > 0 ? Math.round(c.spend30_cents / c.leads) : null;
                  return (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.objective || c.channel}</div>
                      </td>
                      {isAgency(actor) && (
                        <td className="px-3 py-3">
                          <Link href={`/clients/${c.client_id}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900">
                            <span className="h-2 w-2 rounded-full" style={{ background: c.client_color || '#7c3aed' }} />
                            {c.client_name}
                          </Link>
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatCents(c.spend30_cents, true)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatNumber(c.leads)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-900">{cpl !== null ? formatCents(cpl) : '—'}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatNumber(c.converted)}</td>
                      {isAgency(actor) && (
                        <td className="px-5 py-3 text-right">
                          {(c.status === 'active' || c.status === 'paused') && (
                            <form action={toggleCampaignStatusAction} className="inline">
                              <input type="hidden" name="id" value={c.id} />
                              <input type="hidden" name="status" value={c.status === 'active' ? 'paused' : 'active'} />
                              <button type="submit" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title={c.status === 'active' ? 'Pausar' : 'Activar'}>
                                {c.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                              </button>
                            </form>
                          )}
                        </td>
                      )}
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
