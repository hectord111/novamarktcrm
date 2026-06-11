import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink, Trash2, UserPlus, Save, Globe } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { isAgency } from '@/lib/types';
import { getProspect } from '@/lib/data/prospects';
import { buildPitch } from '@/lib/landing';
import { Card, CardHeader, PageHeader, Button, Input, Label, Select, Textarea, Badge } from '@/components/ui';
import { PitchBox } from '@/components/prospecting/PitchBox';
import { PROSPECT_STAGES } from '@/lib/domain';
import { formatDate } from '@/lib/format';
import {
  updateProspectAction,
  setProspectStatusAction,
  deleteProspectAction,
  convertToLeadAction,
  appBaseUrl,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');
  const { id } = await params;
  const p = await getProspect(actor, id);
  if (!p) notFound();

  const base = await appBaseUrl();
  const landingUrl = `${base}/l/${p.landing_slug}`;
  const pitch = p.pitch || buildPitch(p.business_name, p.city, landingUrl);
  const stage = PROSPECT_STAGES.find((s) => s.value === p.status) ?? PROSPECT_STAGES[0];
  const L = p.landing;

  return (
    <div className="animate-in">
      <Link href="/prospecting" className="mb-4 inline-flex items-center gap-1 text-sm text-ink/50 hover:text-ink">
        <ArrowLeft size={15} /> Volver a prospección
      </Link>
      <PageHeader title={`${L.emoji ?? '⭐'} ${p.business_name}`} subtitle={[p.sector, p.city, `añadido ${formatDate(p.created_at)}`].filter(Boolean).join(' · ')}>
        <Badge tone={stage.tone}>{stage.label}</Badge>
        <a href={landingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border-2 border-ink bg-yellow px-4 text-xs font-bold uppercase tracking-wider text-ink shadow-[4px_4px_0_#0b0b0b] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
          <ExternalLink size={14} /> Ver landing
        </a>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ===== Landing editor ===== */}
        <Card className="lg:col-span-2">
          <CardHeader title="Landing de muestra" subtitle="Lo que verá el negocio al abrir tu enlace — edita y guarda" />
          <form action={updateProspectAction} className="space-y-4 p-5">
            <input type="hidden" name="id" value={p.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="business_name">Nombre del negocio</Label>
                <Input id="business_name" name="business_name" defaultValue={p.business_name} required />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono (para botones de la landing y WhatsApp)</Label>
                <Input id="phone" name="phone" defaultValue={p.phone ?? ''} placeholder="+34 600 000 000" />
              </div>
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Input id="sector" name="sector" defaultValue={p.sector ?? ''} />
              </div>
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" name="city" defaultValue={p.city ?? ''} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" name="address" defaultValue={p.address ?? ''} />
              </div>
            </div>

            <hr className="border-ink/10" />

            <div className="grid gap-4 sm:grid-cols-[90px_90px_1fr]">
              <div>
                <Label htmlFor="emoji">Emoji</Label>
                <Input id="emoji" name="emoji" defaultValue={L.emoji} className="text-center text-lg" />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <input id="color" name="color" type="color" defaultValue={L.color} className="h-10 w-full cursor-pointer rounded-md border-2 border-ink/15 bg-white p-1" />
              </div>
              <div>
                <Label htmlFor="cta_label">Botón principal (CTA)</Label>
                <Input id="cta_label" name="cta_label" defaultValue={L.cta_label} />
              </div>
            </div>

            <div>
              <Label htmlFor="headline">Titular</Label>
              <Input id="headline" name="headline" defaultValue={L.headline} />
            </div>
            <div>
              <Label htmlFor="subheadline">Subtítulo</Label>
              <Input id="subheadline" name="subheadline" defaultValue={L.subheadline} />
            </div>
            <div>
              <Label htmlFor="about">Sobre el negocio</Label>
              <Textarea id="about" name="about" defaultValue={L.about} rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="services">Servicios — uno por línea, «Nombre | descripción»</Label>
                <Textarea id="services" name="services" rows={5} defaultValue={L.services.map((s) => `${s.name} | ${s.desc}`).join('\n')} />
              </div>
              <div>
                <Label htmlFor="perks">Ventajas — una por línea</Label>
                <Textarea id="perks" name="perks" rows={5} defaultValue={L.perks.join('\n')} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="hours">Horario</Label>
                <Input id="hours" name="hours" defaultValue={L.hours} />
              </div>
              <div>
                <Label htmlFor="notes">Notas internas</Label>
                <Input id="notes" name="notes" defaultValue={p.notes ?? ''} placeholder="Solo lo ves tú" />
              </div>
            </div>
            {/* keep the saved pitch when saving the landing */}
            <input type="hidden" name="pitch" value={p.pitch ?? ''} />

            <div className="flex justify-end">
              <Button type="submit"><Save size={14} /> Guardar cambios</Button>
            </div>
          </form>
        </Card>

        {/* ===== Right column ===== */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Enlace de la landing" />
            <div className="p-5 pt-4">
              <Input readOnly defaultValue={landingUrl} className="font-mono text-xs" />
              <p className="mt-2 text-[11px] text-ink/40">
                <Globe size={11} className="mr-1 inline" /> Pública (sin login) y oculta a Google. Se actualiza al instante cuando guardas.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Pitch de WhatsApp" subtitle="El mensaje con el enlace, listo para enviar" />
            <div className="p-5 pt-4">
              <PitchBox id={p.id} phone={p.phone} initialPitch={pitch} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Estado" />
            <form action={setProspectStatusAction} className="flex gap-2 p-5 pt-4">
              <input type="hidden" name="id" value={p.id} />
              <Select name="status" defaultValue={p.status}>
                {PROSPECT_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
              <Button type="submit" variant="outline">Cambiar</Button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Acciones" />
            <div className="space-y-2 p-5 pt-4">
              {p.lead_id ? (
                <Button href={`/leads/${p.lead_id}`} variant="accent" className="w-full"><UserPlus size={14} /> Ver su lead</Button>
              ) : (
                <form action={convertToLeadAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" variant="accent" className="w-full"><UserPlus size={14} /> Convertir en lead de Nova</Button>
                </form>
              )}
              <form action={deleteProspectAction}>
                <input type="hidden" name="id" value={p.id} />
                <Button type="submit" variant="danger" className="w-full"><Trash2 size={14} /> Eliminar prospecto</Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
