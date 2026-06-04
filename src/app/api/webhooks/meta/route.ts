import { NextResponse, type NextRequest } from 'next/server';
import { sql, dbConfigured, toJson } from '@/lib/db';
import { createLead } from '@/lib/data/leads';
import { onLeadCreated } from '@/lib/automation-engine';

export const dynamic = 'force-dynamic';

/** Meta webhook verification handshake. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get('hub.mode') === 'subscribe' && p.get('hub.verify_token') === process.env.META_VERIFY_TOKEN) {
    return new Response(p.get('hub.challenge') ?? '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

interface LeadField {
  name: string;
  values: string[];
}

/** Meta Lead Ads leadgen webhook. Attribute the client via ?client=<id>. */
export async function POST(req: NextRequest) {
  if (!dbConfigured()) return NextResponse.json({ ok: false }, { status: 200 });
  const clientParam = req.nextUrl.searchParams.get('client');

  let payload: { entry?: { changes?: { field?: string; value?: Record<string, unknown> }[] }[] };
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  await sql`insert into nova.webhook_events (source, event_type, payload) values ('meta', 'leadgen', ${toJson(payload)})`;

  try {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = (change.value ?? {}) as { leadgen_id?: string; form_id?: string; ad_id?: string };
        const leadgenId = value.leadgen_id ?? null;

        let clientId = clientParam ?? undefined;
        if (!clientId) {
          const all = await sql`select id from nova.clients limit 2`;
          if (all.length === 1) clientId = all[0].id;
        }
        if (!clientId) continue;

        // Pull the actual answers from the Graph API when a token is available.
        const fields: Record<string, string> = {};
        if (leadgenId && process.env.META_ACCESS_TOKEN) {
          try {
            const r = await fetch(`https://graph.facebook.com/v21.0/${leadgenId}?fields=field_data&access_token=${process.env.META_ACCESS_TOKEN}`);
            const d = (await r.json()) as { field_data?: LeadField[] };
            for (const f of d.field_data ?? []) fields[f.name] = Array.isArray(f.values) ? f.values[0] : String(f.values);
          } catch {
            // keep going with empty fields
          }
        }

        const lead = await createLead({
          client_id: clientId,
          meta_lead_id: leadgenId,
          source: 'meta_lead_ad',
          full_name: fields.full_name ?? fields.name ?? null,
          email: fields.email ?? null,
          phone: fields.phone_number ?? fields.phone ?? null,
          custom_fields: fields,
        });
        await onLeadCreated(lead);
      }
    }
  } catch {
    // Always 200 so Meta doesn't retry indefinitely; the raw event is stored above.
  }
  return NextResponse.json({ ok: true });
}
