'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireActor } from '@/lib/auth';
import { searchPlaces, placesConfigured, type PlaceResult } from '@/lib/places';
import {
  createProspects,
  updateProspect,
  setProspectStatus,
  deleteProspect,
  getProspect,
  convertProspectToLead,
  type ProspectStatus,
} from '@/lib/data/prospects';
import { getNovaAccount } from '@/lib/data/accounts';
import { sendWhatsapp } from '@/lib/whatsapp';
import { buildPitch, waPhone, type LandingConfig } from '@/lib/landing';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = v ? String(v).trim() : '';
  return s || null;
}

export async function appBaseUrl() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export interface SearchState {
  configured: boolean;
  results: PlaceResult[];
  error?: string;
}

export async function searchPlacesAction(que: string, donde: string): Promise<SearchState> {
  await requireActor();
  if (!placesConfigured()) return { configured: false, results: [] };
  try {
    const results = await searchPlaces(`${que} en ${donde}`.trim());
    return { configured: true, results };
  } catch (e) {
    return { configured: true, results: [], error: e instanceof Error ? e.message : 'Error buscando negocios' };
  }
}

export async function importProspectsAction(items: PlaceResult[], sector: string, city: string): Promise<number> {
  const actor = await requireActor();
  const imported = await createProspects(
    actor,
    items.map((p) => ({
      business_name: p.name,
      sector: sector || null,
      city: city || null,
      address: p.address,
      phone: p.phone,
      google_place_id: p.place_id,
      has_website: Boolean(p.website),
      website_url: p.website,
      rating: p.rating,
      reviews_count: p.reviews_count,
      source: 'places',
    })),
  );
  revalidatePath('/prospecting');
  return imported;
}

export async function addManualProspectAction(formData: FormData) {
  const actor = await requireActor();
  const name = str(formData, 'business_name');
  if (!name) throw new Error('El nombre del negocio es obligatorio');
  await createProspects(actor, [
    {
      business_name: name,
      sector: str(formData, 'sector'),
      city: str(formData, 'city'),
      phone: str(formData, 'phone'),
      source: 'manual',
    },
  ]);
  revalidatePath('/prospecting');
}

export async function updateProspectAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  const services = (str(formData, 'services') ?? '')
    .split('\n')
    .map((line) => {
      const [name, ...rest] = line.split('|');
      return { name: (name ?? '').trim(), desc: rest.join('|').trim() };
    })
    .filter((s) => s.name);
  const perks = (str(formData, 'perks') ?? '').split('\n').map((p) => p.trim()).filter(Boolean);

  const landing: LandingConfig = {
    color: str(formData, 'color') ?? '#4f46e5',
    emoji: str(formData, 'emoji') ?? '⭐',
    headline: str(formData, 'headline') ?? '',
    subheadline: str(formData, 'subheadline') ?? '',
    about: str(formData, 'about') ?? '',
    services,
    perks,
    cta_label: str(formData, 'cta_label') ?? 'Contactar',
    hours: str(formData, 'hours') ?? '',
  };

  await updateProspect(actor, id, {
    business_name: str(formData, 'business_name') ?? undefined,
    sector: str(formData, 'sector'),
    city: str(formData, 'city'),
    address: str(formData, 'address'),
    phone: str(formData, 'phone'),
    notes: str(formData, 'notes'),
    pitch: str(formData, 'pitch'),
    landing,
  });
  revalidatePath(`/prospecting/${id}`);
  revalidatePath('/prospecting');
}

export async function setProspectStatusAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  const status = String(formData.get('status')) as ProspectStatus;
  await setProspectStatus(actor, id, status);
  revalidatePath(`/prospecting/${id}`);
  revalidatePath('/prospecting');
}

export async function deleteProspectAction(formData: FormData) {
  const actor = await requireActor();
  await deleteProspect(actor, String(formData.get('id')));
  revalidatePath('/prospecting');
  redirect('/prospecting');
}

/** Send the pitch through the CRM's WhatsApp channel (simulation until live creds are set). */
export async function sendPitchAction(id: string, pitchBody: string): Promise<{ ok: boolean; simulated: boolean; error?: string }> {
  const actor = await requireActor();
  const prospect = await getProspect(actor, id);
  if (!prospect) return { ok: false, simulated: false, error: 'Prospecto no encontrado' };
  if (!prospect.phone) return { ok: false, simulated: false, error: 'Este negocio no tiene teléfono guardado' };
  const nova = await getNovaAccount();
  const res = await sendWhatsapp({
    to: waPhone(prospect.phone),
    body: pitchBody,
    clientId: nova?.id ?? null,
  });
  if (res.ok) await setProspectStatus(actor, id, 'contacted');
  revalidatePath(`/prospecting/${id}`);
  revalidatePath('/prospecting');
  return { ok: res.ok, simulated: res.simulated, error: res.error };
}

export async function markContactedAction(id: string) {
  const actor = await requireActor();
  await setProspectStatus(actor, id, 'contacted');
  revalidatePath(`/prospecting/${id}`);
  revalidatePath('/prospecting');
}

export async function convertToLeadAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  const leadId = await convertProspectToLead(actor, id);
  revalidatePath('/prospecting');
  revalidatePath('/leads');
  if (leadId) redirect(`/leads/${leadId}`);
}

/** Default pitch text for a prospect (server helper for the detail page). */
export async function defaultPitchFor(businessName: string, city: string | null, slug: string | null) {
  const base = await appBaseUrl();
  return buildPitch(businessName, city, `${base}/l/${slug ?? ''}`);
}
