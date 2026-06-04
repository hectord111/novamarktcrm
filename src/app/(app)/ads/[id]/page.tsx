import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Rocket, Play, Pause, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { getAd } from '@/lib/data/ads';
import { metaAdsConfigured } from '@/lib/meta-ads';
import { isAgency } from '@/lib/types';
import { Card, CardHeader, PageHeader, Button, Badge } from '@/components/ui';
import { AdPreview } from '@/components/ads/AdPreview';
import { formatCents } from '@/lib/format';
import { publishAdAction, toggleAdLiveAction, deleteAdAction } from '../actions';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { tone: 'slate' | 'amber' | 'sky' | 'green' | 'red'; label: string }> = {
  draft: { tone: 'slate', label: 'Borrador' },
  publishing: { tone: 'amber', label: 'Publicando…' },
  paused: { tone: 'sky', label: 'En pausa en Meta' },
  active: { tone: 'green', label: 'Activo' },
  failed: { tone: 'red', label: 'Error al publicar' },
  archived: { tone: 'slate', label: 'Archivado' },
};
const DEST: Record<string, string> = { link: 'Tráfico a web', whatsapp: 'Mensajes de WhatsApp', lead_form: 'Formulario de leads', call: 'Llamadas' };

export default async function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');
  const { id } = await params;
  const ad = await getAd(actor, id);
  if (!ad) notFound();

  const st = STATUS[ad.status] ?? STATUS.draft;
  const aud = ad.audience || {};
  const adsManager = ad.meta_ad_id && ad.meta_ad_account_id
    ? `https://adsmanager.facebook.com/adsmanager/manage/ads?act=${ad.meta_ad_account_id}&selected_ad_ids=${ad.meta_ad_id}`
    : null;

  return (
    <div className="animate-in">
      <Link href="/ads" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Volver a anuncios
      </Link>
      <PageHeader title={ad.name} subtitle={`${ad.client_name} · ${DEST[ad.destination] ?? ad.destination}`}>
        <Badge tone={st.tone}>{st.label}</Badge>
      </PageHeader>

      {ad.error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{ad.error}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div>
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">Vista previa</div>
          <AdPreview
            pageName={ad.client_name}
            primaryText={ad.primary_text}
            headline={ad.headline}
            description={ad.description_text}
            imageUrl={ad.image_url}
            ctaType={ad.cta_type}
            linkLabel={ad.destination === 'whatsapp' ? 'WhatsApp' : (ad.link_url || '').replace(/^https?:\/\//, '').split('/')[0] || 'tu-web.com'}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Acciones" />
            <div className="flex flex-wrap items-center gap-2 p-5">
              {(ad.status === 'draft' || ad.status === 'failed') && (
                <form action={publishAdAction}>
                  <input type="hidden" name="id" value={ad.id} />
                  <Button type="submit"><Rocket size={16} /> Publicar en Meta (en pausa)</Button>
                </form>
              )}
              {ad.status === 'paused' && (
                <form action={toggleAdLiveAction}>
                  <input type="hidden" name="id" value={ad.id} />
                  <input type="hidden" name="target" value="active" />
                  <Button type="submit"><Play size={16} /> Activar (empezará a gastar)</Button>
                </form>
              )}
              {ad.status === 'active' && (
                <form action={toggleAdLiveAction}>
                  <input type="hidden" name="id" value={ad.id} />
                  <input type="hidden" name="target" value="paused" />
                  <Button type="submit" variant="outline"><Pause size={16} /> Pausar</Button>
                </form>
              )}
              {adsManager && (
                <Button href={adsManager} variant="outline"><ExternalLink size={15} /> Abrir en Meta</Button>
              )}
              <form action={deleteAdAction} className="ml-auto">
                <input type="hidden" name="id" value={ad.id} />
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
                  <Trash2 size={15} /> Eliminar
                </button>
              </form>
            </div>
            {!metaAdsConfigured() && (ad.status === 'draft' || ad.status === 'failed') && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-amber-700">
                Sin <code className="rounded bg-amber-50 px-1">META_ACCESS_TOKEN</code> el anuncio se queda como borrador. Configúralo para publicar en Meta.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Configuración" />
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl bg-slate-100 text-sm">
              <Field label="Objetivo" value={ad.objective} />
              <Field label="Optimización" value={ad.optimization_goal} />
              <Field label="Presupuesto/día" value={formatCents(ad.daily_budget_cents)} />
              <Field label="Botón (CTA)" value={ad.cta_type} />
              <Field label="Edad" value={`${aud.age_min ?? 18} – ${aud.age_max ?? 65}`} />
              <Field label="Género" value={aud.genders?.[0] === 1 ? 'Hombres' : aud.genders?.[0] === 2 ? 'Mujeres' : 'Todos'} />
              <Field label="Ubicación" value={aud.location_name || (aud.countries?.join(', ') ?? 'España')} />
              <Field label="Página" value={ad.resolved_page_id ? `ID ${ad.resolved_page_id}` : 'Sin vincular'} />
              {ad.destination === 'whatsapp' && <Field label="WhatsApp" value={ad.whatsapp_phone} />}
              {ad.destination !== 'whatsapp' && <Field label="Enlace" value={ad.link_url} />}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-white px-4 py-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-slate-800">{value || '—'}</dd>
    </div>
  );
}
