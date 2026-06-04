import 'server-only';
import { sql, toJson } from './db';
import { sendWhatsapp, renderTemplate } from './whatsapp';
import { logActivity } from './data/leads';
import type { Automation, AutomationAction, Lead } from './types';

interface LeadCtx {
  id: string;
  client_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
}

function buildVars(lead: LeadCtx, clientName: string) {
  const first = (lead.full_name ?? '').trim().split(/\s+/)[0] || 'hola';
  return {
    nombre: first,
    nombre_completo: lead.full_name ?? '',
    cliente: clientName,
    telefono: lead.phone ?? '',
    email: lead.email ?? '',
  };
}

async function resolveBody(action: AutomationAction, lead: LeadCtx): Promise<string> {
  if (action.body) return action.body;
  if (action.template_name) {
    const [t] = await sql`
      select body from nova.message_templates
      where name = ${action.template_name} and (client_id = ${lead.client_id} or client_id is null)
      order by (client_id is null) limit 1`;
    if (t?.body) return t.body as string;
  }
  return '¡Hola {{nombre}}! Gracias por tu interés en {{cliente}}. ¿Podrías contarnos un poco más sobre lo que necesitas?';
}

/** Execute the ordered actions of an automation against a lead. */
async function executeActions(automation: Automation, lead: LeadCtx, runId: string, clientName: string) {
  const vars = buildVars(lead, clientName);
  const results: { type: string; ok: boolean; detail?: string }[] = [];

  for (const action of automation.actions ?? []) {
    if (action.type === 'send_whatsapp') {
      const body = renderTemplate(await resolveBody(action, lead), vars);
      const res = await sendWhatsapp({
        to: lead.phone,
        body,
        leadId: lead.id,
        clientId: lead.client_id,
        automationRunId: runId,
      });
      await logActivity(lead.id, null, 'message', res.simulated ? 'WhatsApp de bienvenida (simulado)' : 'WhatsApp de bienvenida enviado', {
        automation: automation.name,
      });
      results.push({ type: action.type, ok: res.ok, detail: res.simulated ? 'simulado' : 'enviado' });
    } else if (action.type === 'update_status' && action.status) {
      await sql`update nova.leads set status = ${action.status} where id = ${lead.id}`;
      await logActivity(lead.id, null, 'status_change', `Automatización cambió el estado a ${action.status}`);
      results.push({ type: action.type, ok: true });
    } else if (action.type === 'notify_team') {
      await logActivity(lead.id, null, 'note', `🔔 ${action.body ?? 'Aviso al equipo'}`);
      results.push({ type: action.type, ok: true });
    } else {
      // send_email / send_sms / wait — recorded as a no-op for now
      results.push({ type: action.type, ok: true, detail: 'omitido' });
    }
  }
  return results;
}

/**
 * Trigger 'lead_created' automations for a newly created lead.
 * Runs synchronously so the welcome WhatsApp goes out immediately.
 */
export async function onLeadCreated(lead: Lead | LeadCtx) {
  const ctx: LeadCtx = {
    id: lead.id,
    client_id: lead.client_id,
    full_name: lead.full_name,
    phone: lead.phone,
    email: lead.email,
  };
  const [client] = await sql`select name from nova.clients where id = ${ctx.client_id} limit 1`;
  const clientName = (client?.name as string) ?? 'nosotros';

  const automations = (await sql`
    select * from nova.automations
    where is_active = true and trigger = 'lead_created' and (client_id is null or client_id = ${ctx.client_id})
    order by created_at`) as unknown as Automation[];

  for (const automation of automations) {
    const [run] = await sql`
      insert into nova.automation_runs (automation_id, lead_id, status) values (${automation.id}, ${ctx.id}, 'running')
      returning id`;
    try {
      const result = await executeActions(automation, ctx, run.id, clientName);
      await sql`update nova.automation_runs set status = 'completed', result = ${toJson({ actions: result })}, completed_at = now() where id = ${run.id}`;
      await sql`update nova.automations set run_count = run_count + 1, last_run_at = now() where id = ${automation.id}`;
    } catch (e) {
      await sql`update nova.automation_runs set status = 'failed', error = ${e instanceof Error ? e.message : String(e)}, completed_at = now() where id = ${run.id}`;
    }
  }
  return automations.length;
}

/**
 * Process time-based 'no_response' automations. Intended to be called from a cron
 * job (see /api/automations/run). Sends a follow-up to leads that are still in the
 * configured statuses N hours after creation and haven't been followed up yet.
 */
export async function runNoResponseAutomations() {
  const automations = (await sql`
    select * from nova.automations where is_active = true and trigger = 'no_response'`) as unknown as Automation[];
  let processed = 0;

  for (const automation of automations) {
    const cfg = (automation.trigger_config ?? {}) as { hours?: number; statuses?: string[] };
    const hours = cfg.hours ?? 24;
    const statuses = cfg.statuses?.length ? cfg.statuses : ['new', 'contacted'];

    const leads = (await sql`
      select l.id, l.client_id, l.full_name, l.phone, l.email, cl.name as client_name
      from nova.leads l join nova.clients cl on cl.id = l.client_id
      where l.status = any(${statuses})
        and l.created_at <= now() - (${hours} || ' hours')::interval
        and (${automation.client_id}::uuid is null or l.client_id = ${automation.client_id})
        and not exists (
          select 1 from nova.automation_runs r where r.automation_id = ${automation.id} and r.lead_id = l.id
        )
      limit 200`) as unknown as (LeadCtx & { client_name: string })[];

    for (const lead of leads) {
      const [run] = await sql`
        insert into nova.automation_runs (automation_id, lead_id, status) values (${automation.id}, ${lead.id}, 'running')
        returning id`;
      try {
        const result = await executeActions(automation, lead, run.id, lead.client_name);
        await sql`update nova.automation_runs set status = 'completed', result = ${toJson({ actions: result })}, completed_at = now() where id = ${run.id}`;
        await sql`update nova.automations set run_count = run_count + 1, last_run_at = now() where id = ${automation.id}`;
        processed++;
      } catch (e) {
        await sql`update nova.automation_runs set status = 'failed', error = ${e instanceof Error ? e.message : String(e)}, completed_at = now() where id = ${run.id}`;
      }
    }
  }
  return processed;
}
