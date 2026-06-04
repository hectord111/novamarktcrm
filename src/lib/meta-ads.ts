import 'server-only';
import type { AdAudience, AdDestination } from './types';

const GRAPH = 'https://graph.facebook.com/v21.0';

export function metaAdsConfigured() {
  return Boolean(process.env.META_ACCESS_TOKEN);
}

async function metaPost(path: string, params: Record<string, unknown>) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN no configurada');
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    body.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  body.set('access_token', token);
  const res = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json()) as { id?: string; error?: { message: string; error_user_msg?: string } };
  if (!res.ok || data.error) throw new Error(data.error?.error_user_msg || data.error?.message || `Graph API ${res.status}`);
  return data;
}

function buildTargeting(a: AdAudience) {
  const t: Record<string, unknown> = {
    geo_locations: { countries: a.countries?.length ? a.countries : ['ES'] },
  };
  if (a.age_min) t.age_min = a.age_min;
  if (a.age_max) t.age_max = a.age_max;
  if (a.genders?.length) t.genders = a.genders;
  return t;
}

export interface PublishInput {
  metaAdAccountId: string; // numeric, without act_
  pageId: string | null;
  name: string;
  objective: string;
  optimizationGoal: string;
  destination: AdDestination;
  ctaType: string;
  primaryText: string | null;
  headline: string | null;
  descriptionText: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  whatsappPhone: string | null;
  dailyBudgetCents: number;
  audience: AdAudience;
  existing?: { campaignId?: string | null };
}

export interface PublishResult {
  meta_campaign_id: string;
  meta_adset_id: string;
  meta_creative_id: string;
  meta_ad_id: string;
}

/**
 * Create a full Meta ad (campaign → ad set → creative → ad). Everything is
 * created **PAUSED** so it never spends until the user activates it.
 */
export async function publishAd(input: PublishInput): Promise<PublishResult> {
  if (!input.pageId) throw new Error('Falta la página de Facebook (page_id) del cliente para crear la creatividad.');
  if (input.destination === 'lead_form') {
    throw new Error('Los anuncios con formulario requieren crear el formulario en Meta. Usa destino “Web” o “WhatsApp”, o publícalo manualmente.');
  }
  const act = `act_${input.metaAdAccountId}`;

  // 1) Campaign
  const campaignId =
    input.existing?.campaignId ||
    (
      await metaPost(`${act}/campaigns`, {
        name: input.name,
        objective: input.objective,
        status: 'PAUSED',
        special_ad_categories: [],
      })
    ).id!;

  // 2) Ad set
  const needsPage = input.optimizationGoal === 'LEAD_GENERATION' || input.optimizationGoal === 'CONVERSATIONS';
  const adset = await metaPost(`${act}/adsets`, {
    name: `${input.name} · conjunto`,
    campaign_id: campaignId,
    status: 'PAUSED',
    billing_event: 'IMPRESSIONS',
    optimization_goal: input.optimizationGoal,
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget: input.dailyBudgetCents,
    targeting: buildTargeting(input.audience),
    ...(needsPage && input.pageId ? { promoted_object: { page_id: input.pageId } } : {}),
  });

  // 3) Creative
  const link =
    input.destination === 'whatsapp'
      ? `https://wa.me/${(input.whatsappPhone || '').replace(/\D/g, '')}`
      : input.linkUrl || 'https://facebook.com';
  const linkData: Record<string, unknown> = {
    message: input.primaryText ?? '',
    link,
    name: input.headline ?? '',
    description: input.descriptionText ?? '',
    call_to_action: { type: input.ctaType, value: { link } },
  };
  if (input.imageUrl) linkData.picture = input.imageUrl;

  const creative = await metaPost(`${act}/adcreatives`, {
    name: `${input.name} · creatividad`,
    object_story_spec: { page_id: input.pageId, link_data: linkData },
  });

  // 4) Ad
  const ad = await metaPost(`${act}/ads`, {
    name: input.name,
    adset_id: adset.id,
    creative: { creative_id: creative.id },
    status: 'PAUSED',
  });

  return {
    meta_campaign_id: campaignId,
    meta_adset_id: adset.id!,
    meta_creative_id: creative.id!,
    meta_ad_id: ad.id!,
  };
}

/** Toggle an existing ad's effective status on Meta. */
export async function setAdStatus(metaAdId: string, status: 'ACTIVE' | 'PAUSED') {
  await metaPost(metaAdId, { status });
}
