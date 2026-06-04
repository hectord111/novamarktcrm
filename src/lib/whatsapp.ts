import 'server-only';
import { getWhatsappConfig } from './data/settings';
import { recordMessage } from './data/messages';
import type { Message } from './types';

/** Replace {{var}} placeholders in a template body. */
export function renderTemplate(body: string, vars: Record<string, string | null | undefined>) {
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

/** WhatsApp expects E.164 digits with no leading +. */
function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, '');
}

export interface SendWhatsappInput {
  to: string | null;
  body: string;
  leadId?: string | null;
  clientId?: string | null;
  templateId?: string | null;
  automationRunId?: string | null;
}

export interface SendResult {
  ok: boolean;
  simulated: boolean;
  error?: string;
  message: Message;
}

/**
 * Send a WhatsApp message. Falls back to "simulation" mode (logged, not really
 * sent) whenever live credentials are missing — so the CRM works end-to-end out
 * of the box and you flip to live by setting the token + mode=live.
 */
export async function sendWhatsapp(input: SendWhatsappInput): Promise<SendResult> {
  const cfg = await getWhatsappConfig();
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = cfg.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const live = cfg.mode === 'live' && Boolean(token) && Boolean(phoneNumberId) && Boolean(input.to);

  const common = {
    lead_id: input.leadId ?? null,
    client_id: input.clientId ?? null,
    channel: 'whatsapp',
    direction: 'outbound' as const,
    to_address: input.to,
    body: input.body,
    template_id: input.templateId ?? null,
    automation_run_id: input.automationRunId ?? null,
  };

  if (!live) {
    const message = await recordMessage({ ...common, status: 'simulated', provider: 'simulation' });
    return { ok: true, simulated: true, message };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizePhone(input.to as string),
        type: 'text',
        text: { body: input.body },
      }),
    });
    const data = (await res.json()) as { messages?: { id: string }[]; error?: { message: string } };
    if (!res.ok) throw new Error(data?.error?.message || `WhatsApp API ${res.status}`);
    const providerId = data?.messages?.[0]?.id ?? null;
    const message = await recordMessage({ ...common, status: 'sent', provider: 'whatsapp_cloud', provider_message_id: providerId });
    return { ok: true, simulated: false, message };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Error desconocido';
    const message = await recordMessage({ ...common, status: 'failed', provider: 'whatsapp_cloud', error });
    return { ok: false, simulated: false, error, message };
  }
}
