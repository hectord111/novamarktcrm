import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, ImagePlus, Info } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listAds } from '@/lib/data/ads';
import { metaAdsConfigured } from '@/lib/meta-ads';
import { isAgency } from '@/lib/types';
import { Card, PageHeader, Button, Badge, EmptyState } from '@/components/ui';
import { formatCents, formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { tone: 'slate' | 'amber' | 'sky' | 'green' | 'red'; label: string }> = {
  draft: { tone: 'slate', label: 'Borrador' },
  publishing: { tone: 'amber', label: 'Publicando…' },
  paused: { tone: 'sky', label: 'En pausa' },
  active: { tone: 'green', label: 'Activo' },
  failed: { tone: 'red', label: 'Error' },
  archived: { tone: 'slate', label: 'Archivado' },
};
const DEST: Record<string, string> = { link: 'Web', whatsapp: 'WhatsApp', lead_form: 'Formulario', call: 'Llamada' };

export default async function AdsPage() {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');
  const ads = await listAds(actor);

  return (
    <div className="animate-in">
      <PageHeader title="Anuncios" subtitle="Crea anuncios de Meta en minutos con plantillas preconfiguradas">
        <Button href="/ads/new">
          <Plus size={16} /> Nuevo anuncio
        </Button>
      </PageHeader>

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
        <Info size={18} className="mt-0.5 shrink-0 text-brand-600" />
        <p>
          Elige una plantilla, ajusta el texto y el presupuesto, y publícalo. Los anuncios se crean en Meta <strong>en pausa</strong>:
          no gastan nada hasta que tú los actives. {metaAdsConfigured() ? 'Meta está conectado ✅' : 'Sin META_ACCESS_TOKEN se guardan como borrador.'}
        </p>
      </div>

      {ads.length === 0 ? (
        <EmptyState
          icon={<ImagePlus size={28} />}
          title="Aún no has creado anuncios"
          description="Crea tu primer anuncio a partir de una plantilla preconfigurada."
          action={<Button href="/ads/new"><Plus size={16} /> Nuevo anuncio</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Anuncio</th>
                  <th className="px-3 py-3 font-medium">Cliente</th>
                  <th className="px-3 py-3 font-medium">Destino</th>
                  <th className="px-3 py-3 text-right font-medium">Presupuesto/día</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Creado</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((a) => {
                  const st = STATUS[a.status] ?? STATUS.draft;
                  return (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link href={`/ads/${a.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                          {a.name}
                        </Link>
                        <div className="truncate text-xs text-slate-400">{a.headline}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <span className="h-2 w-2 rounded-full" style={{ background: a.client_color || '#7c3aed' }} />
                          {a.client_name}
                        </span>
                      </td>
                      <td className="px-3 py-3"><Badge tone="slate">{DEST[a.destination] ?? a.destination}</Badge></td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatCents(a.daily_budget_cents, true)}</td>
                      <td className="px-3 py-3"><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td className="px-5 py-3 text-right text-xs text-slate-400">{formatDate(a.created_at)}</td>
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
