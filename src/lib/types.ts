// Row shapes returned from the `nova` schema (snake_case to match SQL).

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type UserRole = 'owner' | 'admin' | 'agent' | 'client';
export type Channel = 'whatsapp' | 'email' | 'sms';
export type AutomationTrigger = 'lead_created' | 'lead_status_changed' | 'no_response';

export interface Client {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: 'active' | 'paused' | 'archived';
  meta_business_id: string | null;
  monthly_fee_cents: number;
  currency: string;
  color: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  client_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  client_id: string;
  ad_account_id: string | null;
  meta_campaign_id: string | null;
  name: string;
  objective: string | null;
  channel: string;
  status: 'active' | 'paused' | 'ended' | 'draft';
  daily_budget_cents: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  client_id: string;
  campaign_id: string | null;
  ad_account_id: string | null;
  meta_lead_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  source: string;
  value_cents: number | null;
  cost_cents: number | null;
  assigned_to: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  first_contact_at: string | null;
  converted_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
  type: string;
  content: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  client_id: string | null;
  name: string;
  channel: Channel;
  subject: string | null;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationAction {
  type: 'send_whatsapp' | 'send_email' | 'send_sms' | 'wait' | 'update_status' | 'notify_team';
  body?: string;
  subject?: string;
  template_name?: string;
  delay_minutes?: number;
  status?: LeadStatus;
}

export interface Automation {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  trigger: AutomationTrigger;
  trigger_config: Record<string, unknown>;
  actions: AutomationAction[];
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  channel: string;
  direction: 'outbound' | 'inbound';
  template_id: string | null;
  to_address: string | null;
  body: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'simulated';
  provider: string | null;
  provider_message_id: string | null;
  error: string | null;
  automation_run_id: string | null;
  created_at: string;
  sent_at: string | null;
}

export type AdDestination = 'link' | 'whatsapp' | 'lead_form' | 'call';
export type AdStatus = 'draft' | 'publishing' | 'paused' | 'active' | 'failed' | 'archived';

export interface AdAudience {
  countries?: string[];
  age_min?: number;
  age_max?: number;
  genders?: number[];
  location_name?: string;
  radius_km?: number;
  interests?: string[];
}

export interface AdPreset {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  objective: string;
  optimization_goal: string;
  destination: AdDestination;
  cta_type: string;
  daily_budget_cents: number;
  audience: AdAudience;
  primary_text: string | null;
  headline: string | null;
  description_text: string | null;
  is_global: boolean;
  client_id: string | null;
}

export interface Ad {
  id: string;
  client_id: string;
  preset_id: string | null;
  ad_account_id: string | null;
  campaign_id: string | null;
  name: string;
  status: AdStatus;
  destination: AdDestination;
  objective: string | null;
  optimization_goal: string | null;
  cta_type: string | null;
  primary_text: string | null;
  headline: string | null;
  description_text: string | null;
  image_url: string | null;
  link_url: string | null;
  whatsapp_phone: string | null;
  page_id: string | null;
  daily_budget_cents: number;
  audience: AdAudience;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_creative_id: string | null;
  meta_ad_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/** The authenticated user plus their tenant scope. */
export interface Actor {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  client_id: string | null;
  is_active: boolean;
}

export function isAgency(actor: Pick<Actor, 'role'>) {
  return actor.role === 'owner' || actor.role === 'admin' || actor.role === 'agent';
}
