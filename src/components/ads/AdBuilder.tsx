'use client';
import { useMemo, useState } from 'react';
import { Sparkles, Save, Rocket } from 'lucide-react';
import { Card, Button, Input, Textarea, Label, Select } from '@/components/ui';
import { AdPreview } from './AdPreview';
import { cn } from '@/lib/utils';
import type { AdDestination, AdPreset } from '@/lib/types';

const DEST_DEFAULTS: Record<AdDestination, { objective: string; optimization_goal: string; cta_type: string }> = {
  link: { objective: 'OUTCOME_TRAFFIC', optimization_goal: 'LANDING_PAGE_VIEWS', cta_type: 'LEARN_MORE' },
  whatsapp: { objective: 'OUTCOME_ENGAGEMENT', optimization_goal: 'CONVERSATIONS', cta_type: 'WHATSAPP_MESSAGE' },
  lead_form: { objective: 'OUTCOME_LEADS', optimization_goal: 'LEAD_GENERATION', cta_type: 'SIGN_UP' },
  call: { objective: 'OUTCOME_TRAFFIC', optimization_goal: 'LINK_CLICKS', cta_type: 'CALL_NOW' },
};

const DEST_LABELS: { value: AdDestination; label: string; hint: string }[] = [
  { value: 'link', label: 'Web', hint: 'Lleva tráfico a tu página' },
  { value: 'whatsapp', label: 'WhatsApp', hint: 'Reciben mensajes directos' },
  { value: 'lead_form', label: 'Formulario', hint: 'Captan datos en Meta' },
];

const CTA_OPTIONS = ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'BOOK_TRAVEL', 'GET_QUOTE', 'CONTACT_US', 'WHATSAPP_MESSAGE', 'CALL_NOW'];

export function AdBuilder({
  action,
  clients,
  presets,
  adAccounts,
}: {
  action: (fd: FormData) => void | Promise<void>;
  clients: { id: string; name: string; color: string | null }[];
  presets: AdPreset[];
  adAccounts: { id: string; client_id: string; name: string | null; page_id: string | null }[];
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? '');
  const clientAccounts = useMemo(() => adAccounts.filter((a) => a.client_id === clientId), [adAccounts, clientId]);
  const [adAccountId, setAdAccountId] = useState(clientAccounts[0]?.id ?? '');
  const [presetId, setPresetId] = useState('');
  const [name, setName] = useState('');
  const [destination, setDestination] = useState<AdDestination>('link');
  const [ctaType, setCtaType] = useState('LEARN_MORE');
  const [primaryText, setPrimaryText] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [budget, setBudget] = useState(10);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [genders, setGenders] = useState('');
  const [locationName, setLocationName] = useState('');

  const selectedAccount = clientAccounts.find((a) => a.id === adAccountId) ?? clientAccounts[0];
  const pageId = selectedAccount?.page_id ?? '';
  const clientName = clients.find((c) => c.id === clientId)?.name ?? 'Tu negocio';

  function onClient(id: string) {
    setClientId(id);
    const accs = adAccounts.filter((a) => a.client_id === id);
    setAdAccountId(accs[0]?.id ?? '');
  }

  function applyPreset(id: string) {
    setPresetId(id);
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setDestination(p.destination);
    setCtaType(p.cta_type);
    setPrimaryText(p.primary_text ?? '');
    setHeadline(p.headline ?? '');
    setDescription(p.description_text ?? '');
    setBudget(Math.round(p.daily_budget_cents / 100));
    setName((n) => n || `${clientName} · ${p.name.split('·').pop()?.trim() ?? p.name}`);
    if (p.audience.age_min) setAgeMin(p.audience.age_min);
    if (p.audience.age_max) setAgeMax(p.audience.age_max);
    setGenders(p.audience.genders?.[0] === 1 ? 'men' : p.audience.genders?.[0] === 2 ? 'women' : '');
    setLocationName(p.audience.location_name ?? '');
  }

  function onDestination(d: AdDestination) {
    setDestination(d);
    setCtaType(DEST_DEFAULTS[d].cta_type);
  }

  const linkLabel = destination === 'whatsapp' ? 'WhatsApp' : linkUrl ? linkUrl.replace(/^https?:\/\//, '').split('/')[0] : 'tu-web.com';

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* hidden derived fields */}
      <input type="hidden" name="objective" value={DEST_DEFAULTS[destination].objective} />
      <input type="hidden" name="optimization_goal" value={DEST_DEFAULTS[destination].optimization_goal} />
      <input type="hidden" name="destination" value={destination} />
      <input type="hidden" name="cta_type" value={ctaType} />
      <input type="hidden" name="preset_id" value={presetId} />
      <input type="hidden" name="ad_account_id" value={adAccountId} />
      <input type="hidden" name="page_id" value={pageId} />

      <div className="space-y-5">
        {/* Preset gallery */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Sparkles size={16} className="text-brand-600" /> Elige una plantilla
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {presets.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={cn(
                  'rounded-xl border p-3 text-left transition',
                  presetId === p.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <div className="text-sm font-medium text-slate-900">{p.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">{p.description}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="client_id">Cliente *</Label>
              <Select id="client_id" name="client_id" value={clientId} onChange={(e) => onClient(e.target.value)} required>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="name">Nombre del anuncio *</Label>
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Captación junio" />
            </div>
          </div>

          {clientAccounts.length > 0 ? (
            <div>
              <Label htmlFor="ad_account">Cuenta publicitaria</Label>
              <Select id="ad_account" value={adAccountId} onChange={(e) => setAdAccountId(e.target.value)}>
                {clientAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || a.id} {a.page_id ? '· página vinculada' : '· sin página'}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Este cliente no tiene cuenta de Meta vinculada. Puedes guardar el anuncio como borrador.
            </p>
          )}

          {/* Destination */}
          <div>
            <Label>Destino del anuncio</Label>
            <div className="grid grid-cols-3 gap-2">
              {DEST_LABELS.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => onDestination(d.value)}
                  className={cn(
                    'rounded-lg border p-2.5 text-center transition',
                    destination === d.value ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <div className="text-sm font-medium text-slate-900">{d.label}</div>
                  <div className="text-[11px] text-slate-500">{d.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {destination === 'whatsapp' ? (
            <div>
              <Label htmlFor="whatsapp_phone">Número de WhatsApp</Label>
              <Input id="whatsapp_phone" name="whatsapp_phone" value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} placeholder="+34 600 000 000" />
            </div>
          ) : (
            <div>
              <Label htmlFor="link_url">Enlace de destino</Label>
              <Input id="link_url" name="link_url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://tu-web.com/oferta" />
            </div>
          )}
        </Card>

        {/* Creative */}
        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold text-slate-800">Creatividad</div>
          <div>
            <Label htmlFor="primary_text">Texto principal</Label>
            <Textarea id="primary_text" name="primary_text" rows={3} value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} placeholder="El texto que verá la gente arriba del anuncio…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="headline">Titular</Label>
              <Input id="headline" name="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Titular llamativo" />
            </div>
            <div>
              <Label htmlFor="cta">Botón (CTA)</Label>
              <Select id="cta" value={ctaType} onChange={(e) => setCtaType(e.target.value)}>
                {CTA_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description_text">Descripción</Label>
            <Input id="description_text" name="description_text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Texto secundario (opcional)" />
          </div>
          <div>
            <Label htmlFor="image_url">URL de la imagen</Label>
            <Input id="image_url" name="image_url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/imagen.jpg" />
          </div>
        </Card>

        {/* Budget & audience */}
        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold text-slate-800">Presupuesto y público</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="daily_budget_eur">Presupuesto diario (€)</Label>
              <Input id="daily_budget_eur" name="daily_budget_eur" type="number" min="1" step="1" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="location_name">Ubicación</Label>
              <Input id="location_name" name="location_name" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Ej. Alicante" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="age_min">Edad mín.</Label>
              <Input id="age_min" name="age_min" type="number" min="13" max="65" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="age_max">Edad máx.</Label>
              <Input id="age_max" name="age_max" type="number" min="13" max="65" value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="genders">Género</Label>
              <Select id="genders" name="genders" value={genders} onChange={(e) => setGenders(e.target.value)}>
                <option value="">Todos</option>
                <option value="men">Hombres</option>
                <option value="women">Mujeres</option>
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {/* Sticky preview + actions */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">Vista previa</div>
        <AdPreview
          pageName={clientName}
          primaryText={primaryText}
          headline={headline}
          description={description}
          imageUrl={imageUrl}
          ctaType={ctaType}
          linkLabel={linkLabel}
        />
        <div className="mt-4 space-y-2">
          <Button type="submit" name="publish" value="1" className="w-full">
            <Rocket size={16} /> Crear y publicar (en pausa)
          </Button>
          <Button type="submit" name="publish" value="0" variant="outline" className="w-full">
            <Save size={16} /> Guardar borrador
          </Button>
          <p className="text-center text-[11px] text-slate-400">Al publicar, el anuncio se crea en Meta <strong>en pausa</strong>. No gasta nada hasta que lo actives.</p>
        </div>
      </div>
    </form>
  );
}
