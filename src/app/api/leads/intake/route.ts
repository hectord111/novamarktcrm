import { NextResponse, type NextRequest } from 'next/server';
import { sql, dbConfigured } from '@/lib/db';
import { createLead } from '@/lib/data/leads';
import { onLeadCreated } from '@/lib/automation-engine';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest) {
  const secret = process.env.LEAD_INTAKE_SECRET;
  if (!secret) return true; // open if no secret configured (set one in production!)
  const header = req.headers.get('x-nova-secret');
  const query = req.nextUrl.searchParams.get('secret');
  return header === secret || query === secret;
}

/**
 * Generic lead intake — point web forms, landing pages or Zapier here.
 * Body: { client_id | client_slug, full_name|name, email, phone, source?, campaign_id?, campaign_meta_id?, custom_fields?, utm_* }
 */
export async function POST(req: NextRequest) {
  if (!dbConfigured()) return NextResponse.json({ error: 'Base de datos no configurada' }, { status: 500 });
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  let clientId = (body.client_id as string) || undefined;
  if (!clientId && body.client_slug) {
    const [c] = await sql`select id from nova.clients where slug = ${String(body.client_slug)} limit 1`;
    clientId = c?.id;
  }
  if (!clientId) {
    const all = await sql`select id from nova.clients limit 2`;
    if (all.length === 1) clientId = all[0].id;
  }
  if (!clientId) return NextResponse.json({ error: 'No se pudo determinar el cliente (usa client_id o client_slug)' }, { status: 400 });

  let campaignId = (body.campaign_id as string) || null;
  if (!campaignId && body.campaign_meta_id) {
    const [cm] = await sql`select id from nova.campaigns where meta_campaign_id = ${String(body.campaign_meta_id)} limit 1`;
    campaignId = cm?.id ?? null;
  }

  const lead = await createLead({
    client_id: clientId,
    campaign_id: campaignId,
    full_name: (body.full_name as string) ?? (body.name as string) ?? null,
    email: (body.email as string) ?? null,
    phone: (body.phone as string) ?? null,
    source: (body.source as string) ?? 'webhook',
    custom_fields: (body.custom_fields as Record<string, unknown>) ?? {},
    utm_source: (body.utm_source as string) ?? null,
    utm_medium: (body.utm_medium as string) ?? null,
    utm_campaign: (body.utm_campaign as string) ?? null,
    meta_lead_id: (body.meta_lead_id as string) ?? null,
  });
  await onLeadCreated(lead);

  return NextResponse.json({ ok: true, lead_id: lead.id });
}
