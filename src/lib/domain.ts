import type { LeadStatus, UserRole } from './types';

/** Ordered pipeline stages with display metadata. */
export const LEAD_STAGES: { value: LeadStatus; label: string; color: string; dot: string }[] = [
  { value: 'new', label: 'Nuevo', color: 'bg-sky-50 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  { value: 'contacted', label: 'Contactado', color: 'bg-violet-50 text-violet-700 ring-violet-600/20', dot: 'bg-violet-500' },
  { value: 'qualified', label: 'Cualificado', color: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  { value: 'converted', label: 'Cliente cerrado', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  { value: 'lost', label: 'Perdido', color: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
];

export const STAGE_MAP = Object.fromEntries(LEAD_STAGES.map((s) => [s.value, s])) as Record<
  LeadStatus,
  (typeof LEAD_STAGES)[number]
>;

export function stageLabel(status: LeadStatus) {
  return STAGE_MAP[status]?.label ?? status;
}

export const SOURCE_LABELS: Record<string, string> = {
  meta_lead_ad: 'Meta · Lead Ad',
  facebook: 'Facebook',
  instagram: 'Instagram',
  manual: 'Manual',
  webhook: 'Webhook',
  import: 'Importación',
  website: 'Web',
  prospecting: 'Prospección',
};

export function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

/** Prospecting funnel stages (Nova's own outreach to businesses without a web). */
export const PROSPECT_STAGES: { value: string; label: string; tone: 'slate' | 'amber' | 'sky' | 'brand' | 'green' | 'red' }[] = [
  { value: 'new', label: 'Nuevo', tone: 'slate' },
  { value: 'contacted', label: 'Contactado', tone: 'amber' },
  { value: 'replied', label: 'Respondió', tone: 'sky' },
  { value: 'interested', label: 'Interesado', tone: 'brand' },
  { value: 'converted', label: 'Cliente 🎉', tone: 'green' },
  { value: 'discarded', label: 'Descartado', tone: 'red' },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  agent: 'Agente',
  client: 'Cliente',
};

export const AUTOMATION_TRIGGER_LABELS: Record<string, string> = {
  lead_created: 'Cuando entra un lead nuevo',
  lead_status_changed: 'Cuando cambia el estado de un lead',
  no_response: 'Cuando un lead no responde',
};

export const ACTION_LABELS: Record<string, string> = {
  send_whatsapp: 'Enviar WhatsApp',
  send_email: 'Enviar email',
  send_sms: 'Enviar SMS',
  wait: 'Esperar',
  update_status: 'Cambiar estado',
  notify_team: 'Avisar al equipo',
};
