-- ============================================================================
-- Nova Marketing CRM — FULL INSTALL (run once on a fresh Supabase project)
-- ----------------------------------------------------------------------------
-- Paste this whole file into:  Supabase → SQL Editor → New query → Run.
-- It is idempotent (safe to re-run) and bundles migrations 0001–0005 + the
-- ad-template library. It creates a CLEAN install: schema, the internal "Nova"
-- account, RLS and ad presets — but NO demo clients/leads (you start empty).
-- ============================================================================

create schema if not exists nova;

create or replace function nova.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===== Core tables =========================================================
create table if not exists nova.clients (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text unique not null,
  industry          text,
  contact_name      text,
  contact_email     text,
  contact_phone     text,
  status            text not null default 'active' check (status in ('active','paused','archived')),
  meta_business_id  text,
  monthly_fee_cents integer not null default 0,
  currency          text not null default 'EUR',
  color             text,
  notes             text,
  kind              text not null default 'client' check (kind in ('client','internal')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists nova.users (
  id          uuid primary key,
  email       text not null,
  full_name   text,
  role        text not null default 'agent' check (role in ('owner','admin','agent','client')),
  client_id   uuid references nova.clients(id) on delete set null,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists users_client_idx on nova.users (client_id);

create table if not exists nova.ad_accounts (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid references nova.clients(id) on delete cascade,
  meta_ad_account_id text not null unique,
  name               text,
  business_name      text,
  currency           text not null default 'EUR',
  status             text default 'active',
  page_id            text,
  page_name          text,
  created_at         timestamptz not null default now()
);

create table if not exists nova.campaigns (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references nova.clients(id) on delete cascade,
  ad_account_id      uuid references nova.ad_accounts(id) on delete set null,
  meta_campaign_id   text,
  name               text not null,
  objective          text,
  channel            text not null default 'meta' check (channel in ('meta','facebook','instagram','google','tiktok','other')),
  status             text not null default 'active' check (status in ('active','paused','ended','draft')),
  daily_budget_cents integer,
  started_at         date,
  ended_at           date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists campaigns_client_idx on nova.campaigns (client_id);
create unique index if not exists campaigns_meta_idx on nova.campaigns (meta_campaign_id) where meta_campaign_id is not null;

create table if not exists nova.campaign_metrics (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references nova.campaigns(id) on delete cascade,
  date         date not null,
  spend_cents  integer not null default 0,
  impressions  integer not null default 0,
  clicks       integer not null default 0,
  leads_count  integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (campaign_id, date)
);

create table if not exists nova.leads (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references nova.clients(id) on delete cascade,
  campaign_id      uuid references nova.campaigns(id) on delete set null,
  ad_account_id    uuid references nova.ad_accounts(id) on delete set null,
  meta_lead_id     text,
  full_name        text,
  email            text,
  phone            text,
  status           text not null default 'new' check (status in ('new','contacted','qualified','converted','lost')),
  source           text not null default 'manual',
  value_cents      integer,
  cost_cents       integer,
  assigned_to      uuid references nova.users(id) on delete set null,
  notes            text,
  custom_fields    jsonb not null default '{}'::jsonb,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  first_contact_at timestamptz,
  converted_at     timestamptz,
  lost_reason      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists leads_client_idx   on nova.leads (client_id);
create index if not exists leads_status_idx   on nova.leads (status);
create index if not exists leads_campaign_idx  on nova.leads (campaign_id);
create index if not exists leads_created_idx  on nova.leads (created_at);
create unique index if not exists leads_meta_idx on nova.leads (meta_lead_id) where meta_lead_id is not null;

create table if not exists nova.lead_activities (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references nova.leads(id) on delete cascade,
  user_id    uuid references nova.users(id) on delete set null,
  type       text not null,
  content    text,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists lead_activities_lead_idx on nova.lead_activities (lead_id, created_at desc);

create table if not exists nova.message_templates (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references nova.clients(id) on delete cascade,
  name       text not null,
  channel    text not null default 'whatsapp' check (channel in ('whatsapp','email','sms')),
  subject    text,
  body       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nova.automations (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid references nova.clients(id) on delete cascade,
  name           text not null,
  description    text,
  trigger        text not null check (trigger in ('lead_created','lead_status_changed','no_response')),
  trigger_config jsonb not null default '{}'::jsonb,
  actions        jsonb not null default '[]'::jsonb,
  is_active      boolean not null default true,
  run_count      integer not null default 0,
  last_run_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists nova.automation_runs (
  id            uuid primary key default gen_random_uuid(),
  automation_id uuid not null references nova.automations(id) on delete cascade,
  lead_id       uuid references nova.leads(id) on delete set null,
  status        text not null default 'pending' check (status in ('pending','running','completed','failed','skipped')),
  result        jsonb not null default '{}'::jsonb,
  error         text,
  scheduled_for timestamptz,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);
create index if not exists automation_runs_due_idx on nova.automation_runs (status, scheduled_for);

create table if not exists nova.messages (
  id                  uuid primary key default gen_random_uuid(),
  lead_id             uuid references nova.leads(id) on delete cascade,
  client_id           uuid references nova.clients(id) on delete cascade,
  channel             text not null default 'whatsapp',
  direction           text not null default 'outbound' check (direction in ('outbound','inbound')),
  template_id         uuid references nova.message_templates(id) on delete set null,
  to_address          text,
  body                text,
  status              text not null default 'queued' check (status in ('queued','sent','delivered','read','failed','simulated')),
  provider            text,
  provider_message_id text,
  error               text,
  automation_run_id   uuid references nova.automation_runs(id) on delete set null,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);
create index if not exists messages_lead_idx on nova.messages (lead_id, created_at desc);

create table if not exists nova.settings (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references nova.clients(id) on delete cascade,
  key        text not null,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (client_id, key)
);
create unique index if not exists settings_global_key_idx on nova.settings (key) where client_id is null;

create table if not exists nova.webhook_events (
  id         uuid primary key default gen_random_uuid(),
  source     text not null default 'meta',
  event_type text,
  payload    jsonb not null default '{}'::jsonb,
  processed  boolean not null default false,
  error      text,
  created_at timestamptz not null default now()
);

-- ===== Ads (builder) =======================================================
create table if not exists nova.ad_presets (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  description        text,
  industry           text,
  objective          text not null default 'OUTCOME_TRAFFIC',
  optimization_goal  text not null default 'LINK_CLICKS',
  destination        text not null default 'link' check (destination in ('link','whatsapp','lead_form','call')),
  cta_type           text not null default 'LEARN_MORE',
  daily_budget_cents integer not null default 1000,
  audience           jsonb not null default '{}'::jsonb,
  primary_text       text,
  headline           text,
  description_text   text,
  is_global          boolean not null default true,
  client_id          uuid references nova.clients(id) on delete cascade,
  created_at         timestamptz not null default now()
);

create table if not exists nova.ads (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references nova.clients(id) on delete cascade,
  preset_id          uuid references nova.ad_presets(id) on delete set null,
  ad_account_id      uuid references nova.ad_accounts(id) on delete set null,
  campaign_id        uuid references nova.campaigns(id) on delete set null,
  name               text not null,
  status             text not null default 'draft' check (status in ('draft','publishing','paused','active','failed','archived')),
  destination        text not null default 'link',
  objective          text,
  optimization_goal  text,
  cta_type           text,
  primary_text       text,
  headline           text,
  description_text   text,
  image_url          text,
  link_url           text,
  whatsapp_phone     text,
  page_id            text,
  daily_budget_cents integer not null default 1000,
  audience           jsonb not null default '{}'::jsonb,
  meta_campaign_id   text,
  meta_adset_id      text,
  meta_creative_id   text,
  meta_ad_id         text,
  error              text,
  created_by         uuid references nova.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists ads_client_idx on nova.ads (client_id, created_at desc);

-- ===== Prospecting =========================================================
create table if not exists nova.prospects (
  id              uuid primary key default gen_random_uuid(),
  business_name   text not null,
  sector          text,
  city            text,
  address         text,
  phone           text,
  email           text,
  google_place_id text,
  has_website     boolean not null default false,
  website_url     text,
  rating          real,
  reviews_count   int,
  status          text not null default 'new' check (status in ('new','contacted','replied','interested','converted','discarded')),
  landing         jsonb not null default '{}'::jsonb,
  landing_slug    text,
  pitch           text,
  lead_id         uuid references nova.leads(id) on delete set null,
  contacted_at    timestamptz,
  notes           text,
  source          text not null default 'manual',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists prospects_place_uq on nova.prospects (google_place_id) where google_place_id is not null;
create unique index if not exists prospects_slug_uq  on nova.prospects (landing_slug)    where landing_slug is not null;
create index if not exists prospects_status_idx on nova.prospects (status);

-- ===== Triggers ============================================================
drop trigger if exists trg_clients_updated on nova.clients;
create trigger trg_clients_updated     before update on nova.clients          for each row execute function nova.set_updated_at();
drop trigger if exists trg_users_updated on nova.users;
create trigger trg_users_updated       before update on nova.users            for each row execute function nova.set_updated_at();
drop trigger if exists trg_campaigns_updated on nova.campaigns;
create trigger trg_campaigns_updated   before update on nova.campaigns        for each row execute function nova.set_updated_at();
drop trigger if exists trg_leads_updated on nova.leads;
create trigger trg_leads_updated       before update on nova.leads            for each row execute function nova.set_updated_at();
drop trigger if exists trg_templates_updated on nova.message_templates;
create trigger trg_templates_updated   before update on nova.message_templates for each row execute function nova.set_updated_at();
drop trigger if exists trg_automations_updated on nova.automations;
create trigger trg_automations_updated before update on nova.automations      for each row execute function nova.set_updated_at();
drop trigger if exists trg_ads_updated on nova.ads;
create trigger trg_ads_updated         before update on nova.ads              for each row execute function nova.set_updated_at();
drop trigger if exists trg_prospects_updated on nova.prospects;
create trigger trg_prospects_updated   before update on nova.prospects        for each row execute function nova.set_updated_at();

-- ===== The internal "Nova" account =========================================
insert into nova.clients (name, slug, kind, industry, contact_name, color, status, monthly_fee_cents)
select 'Nova Marketing', 'nova', 'internal', 'Agencia de marketing', 'Nova Marketing', '#0b0b0b', 'active', 0
where not exists (select 1 from nova.clients where kind = 'internal');

-- ===== Ad template library =================================================
insert into nova.ad_presets (name, description, industry, objective, optimization_goal, destination, cta_type, daily_budget_cents, audience, primary_text, headline, description_text)
select * from (values
  ('Inmobiliaria · Captación de compradores', 'Tráfico a tu web con propiedades destacadas', 'Inmobiliaria',
   'OUTCOME_TRAFFIC','LANDING_PAGE_VIEWS','link','LEARN_MORE', 2500,
   '{"countries":["ES"],"age_min":30,"age_max":60,"location_name":"Costa Blanca","radius_km":25}'::jsonb,
   '🏡 ¿Buscas tu próxima casa en la Costa Blanca? Tenemos propiedades exclusivas desde 150.000€. Reserva una visita sin compromiso 👇',
   'Encuentra tu casa ideal', 'Visitas sin compromiso'),
  ('Inmobiliaria · Vende tu casa', 'Capta propietarios que quieren vender (formulario)', 'Inmobiliaria',
   'OUTCOME_LEADS','LEAD_GENERATION','lead_form','SIGN_UP', 3000,
   '{"countries":["ES"],"age_min":35,"age_max":65}'::jsonb,
   '¿Quieres vender tu casa al mejor precio? 📈 Te hacemos una valoración GRATIS en 24h. Déjanos tus datos y te llamamos.',
   'Valoración gratis de tu casa', 'Sin compromiso · respuesta en 24h'),
  ('Barbería · Reserva por WhatsApp', 'Mensajes directos a WhatsApp para reservar cita', 'Barbería',
   'OUTCOME_ENGAGEMENT','CONVERSATIONS','whatsapp','WHATSAPP_MESSAGE', 1200,
   '{"countries":["ES"],"age_min":18,"age_max":45,"genders":[1],"radius_km":10}'::jsonb,
   '💈 Corte + barba por 9,90€ esta semana. Escríbenos por WhatsApp y reserva tu cita en 1 minuto ✂️',
   'Reserva tu cita', 'Corte + barba 9,90€'),
  ('Clínica · Primera visita gratis', 'Tráfico web para captar primeras visitas', 'Clínica dental',
   'OUTCOME_TRAFFIC','LANDING_PAGE_VIEWS','link','BOOK_TRAVEL', 2000,
   '{"countries":["ES"],"age_min":25,"age_max":60,"radius_km":15}'::jsonb,
   '🦷 Primera visita + revisión GRATIS. Cuida tu sonrisa con los mejores profesionales. Pide cita hoy 👇',
   'Primera visita gratis', 'Pide tu cita online'),
  ('Genérico · Oferta / promoción local', 'Promoción de un negocio local con CTA a la web', null,
   'OUTCOME_TRAFFIC','LINK_CLICKS','link','SHOP_NOW', 1500,
   '{"countries":["ES"],"age_min":18,"age_max":65,"radius_km":20}'::jsonb,
   '🔥 Oferta por tiempo limitado. Descubre por qué somos la opción favorita de la zona. ¡Aprovecha ahora!',
   'Aprovecha la oferta', 'Solo esta semana'),
  ('Genérico · Mensajes por WhatsApp', 'Click-to-WhatsApp para cualquier negocio', null,
   'OUTCOME_ENGAGEMENT','CONVERSATIONS','whatsapp','WHATSAPP_MESSAGE', 1000,
   '{"countries":["ES"],"age_min":18,"age_max":65}'::jsonb,
   '¿Tienes dudas? 💬 Escríbenos por WhatsApp y te ayudamos al momento, sin compromiso.',
   'Habla con nosotros', 'Respuesta rápida por WhatsApp')
) as v(name, description, industry, objective, optimization_goal, destination, cta_type, daily_budget_cents, audience, primary_text, headline, description_text)
where not exists (select 1 from nova.ad_presets);

-- ===== Default global settings =============================================
insert into nova.settings (client_id, key, value) values
  (null, 'whatsapp', jsonb_build_object('mode','simulation','provider','whatsapp_cloud','phone_number_id','','from','')),
  (null, 'branding', jsonb_build_object('agency_name','Nova Marketing','primary','#E5FF00'))
on conflict do nothing;

-- ===== Row Level Security (deny the public anon/authenticated keys) =========
-- The app connects server-side as the `postgres` role (bypasses RLS), so this
-- locks down the API keys without affecting the application.
alter table nova.clients            enable row level security;
alter table nova.users              enable row level security;
alter table nova.ad_accounts        enable row level security;
alter table nova.campaigns          enable row level security;
alter table nova.campaign_metrics   enable row level security;
alter table nova.leads              enable row level security;
alter table nova.lead_activities    enable row level security;
alter table nova.message_templates  enable row level security;
alter table nova.automations        enable row level security;
alter table nova.automation_runs    enable row level security;
alter table nova.messages           enable row level security;
alter table nova.settings           enable row level security;
alter table nova.webhook_events     enable row level security;
alter table nova.ad_presets         enable row level security;
alter table nova.ads                enable row level security;
alter table nova.prospects          enable row level security;

-- Done. Next: connect this project to Vercel (env vars) and redeploy.
