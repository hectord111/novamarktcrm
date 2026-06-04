'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireActor } from '@/lib/auth';
import { createAd, getAd, setAdResult, deleteAd } from '@/lib/data/ads';
import { publishAd, setAdStatus, metaAdsConfigured } from '@/lib/meta-ads';
import type { AdAudience, AdDestination } from '@/lib/types';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = v ? String(v).trim() : '';
  return s || null;
}
function num(fd: FormData, key: string): number | undefined {
  const v = fd.get(key);
  if (!v || !String(v).trim()) return undefined;
  return Number(v);
}

function audienceFromForm(fd: FormData): AdAudience {
  const genders = str(fd, 'genders');
  return {
    countries: ['ES'],
    age_min: num(fd, 'age_min') ?? 18,
    age_max: num(fd, 'age_max') ?? 65,
    genders: genders === 'men' ? [1] : genders === 'women' ? [2] : [],
    location_name: str(fd, 'location_name') ?? undefined,
  };
}

export async function createAdAction(formData: FormData) {
  const actor = await requireActor();
  const client_id = str(formData, 'client_id');
  const name = str(formData, 'name');
  if (!client_id || !name) throw new Error('Cliente y nombre son obligatorios');

  const ad = await createAd(actor, {
    client_id,
    preset_id: str(formData, 'preset_id'),
    ad_account_id: str(formData, 'ad_account_id'),
    name,
    destination: (str(formData, 'destination') ?? 'link') as AdDestination,
    objective: str(formData, 'objective') ?? 'OUTCOME_TRAFFIC',
    optimization_goal: str(formData, 'optimization_goal') ?? 'LINK_CLICKS',
    cta_type: str(formData, 'cta_type') ?? 'LEARN_MORE',
    primary_text: str(formData, 'primary_text'),
    headline: str(formData, 'headline'),
    description_text: str(formData, 'description_text'),
    image_url: str(formData, 'image_url'),
    link_url: str(formData, 'link_url'),
    whatsapp_phone: str(formData, 'whatsapp_phone'),
    page_id: str(formData, 'page_id'),
    daily_budget_cents: Math.round((num(formData, 'daily_budget_eur') ?? 10) * 100),
    audience: audienceFromForm(formData),
  });

  if (formData.get('publish') === '1') await doPublish(actor, ad.id);
  revalidatePath('/ads');
  redirect(`/ads/${ad.id}`);
}

/** Shared publish flow used by the builder ("Crear y publicar") and the detail page. */
async function doPublish(actor: Awaited<ReturnType<typeof requireActor>>, id: string) {
  const ad = await getAd(actor, id);
  if (!ad) throw new Error('Anuncio no encontrado');
  if (!ad.meta_ad_account_id) {
    await setAdResult(id, 'draft', undefined, 'El cliente no tiene una cuenta publicitaria de Meta vinculada.');
    return;
  }
  if (!metaAdsConfigured()) {
    await setAdResult(id, 'draft', undefined, 'Configura META_ACCESS_TOKEN para publicar en Meta.');
    return;
  }
  await setAdResult(id, 'publishing');
  try {
    const result = await publishAd({
      metaAdAccountId: ad.meta_ad_account_id,
      pageId: ad.resolved_page_id,
      name: ad.name,
      objective: ad.objective ?? 'OUTCOME_TRAFFIC',
      optimizationGoal: ad.optimization_goal ?? 'LINK_CLICKS',
      destination: ad.destination,
      ctaType: ad.cta_type ?? 'LEARN_MORE',
      primaryText: ad.primary_text,
      headline: ad.headline,
      descriptionText: ad.description_text,
      imageUrl: ad.image_url,
      linkUrl: ad.link_url,
      whatsappPhone: ad.whatsapp_phone,
      dailyBudgetCents: ad.daily_budget_cents,
      audience: ad.audience,
      existing: { campaignId: ad.meta_campaign_id },
    });
    await setAdResult(id, 'paused', result, null);
  } catch (e) {
    await setAdResult(id, 'failed', undefined, e instanceof Error ? e.message : String(e));
  }
}

export async function publishAdAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  await doPublish(actor, id);
  revalidatePath(`/ads/${id}`);
  revalidatePath('/ads');
}

export async function toggleAdLiveAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  const target = String(formData.get('target')) === 'active' ? 'active' : 'paused';
  const ad = await getAd(actor, id);
  if (!ad?.meta_ad_id) return;
  if (!metaAdsConfigured()) {
    await setAdResult(id, target, undefined, 'META_ACCESS_TOKEN no configurada');
  } else {
    try {
      await setAdStatus(ad.meta_ad_id, target === 'active' ? 'ACTIVE' : 'PAUSED');
      await setAdResult(id, target, undefined, null);
    } catch (e) {
      await setAdResult(id, 'failed', undefined, e instanceof Error ? e.message : String(e));
    }
  }
  revalidatePath(`/ads/${id}`);
  revalidatePath('/ads');
}

export async function deleteAdAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get('id'));
  await deleteAd(actor, id);
  revalidatePath('/ads');
  redirect('/ads');
}
