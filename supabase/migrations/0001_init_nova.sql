-- Nova Marketing CRM — initial schema
-- Everything lives in a dedicated `nova` schema so it is fully isolated from
-- any other app that shares this Supabase project (e.g. Barber Booster's `public` tables).
-- Data is accessed server-side via a direct Postgres connection (DATABASE_URL); the
-- schema is intentionally NOT exposed to the public PostgREST API. Tenant isolation is
-- enforced in the application data layer (see src/lib/data).

create schema if not exists nova;

-- helper: keep updated_at fresh
create or replace function nova.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- CLIENTS  (the businesses Nova Marketing runs ads for)
-- ---------------------------------------------------------------------------
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
  monthly_fee_cents integer not null default 0,   -- what the client pays Nova (for margin/ROI)
  currency          text not null default 'EUR',
  color             text,                          -- UI accent
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- USERS  (app users; id == auth.users.id)
-- ---------------------------------------------------------------------------
create table if not exists nova.users (
  id          uuid primary key,
  email       text not null,
  full_name   text,
  role        text not null default 'agent' check (role in ('owner','admin','agent','client')),
  client_id   uuid references nova.clients(id) on delete set null,  -- set for client-portal users
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists users_client_idx on nova.users (client_id);

-- ---------------------------------------------------------------------------
-- AD ACCOUNTS  (Meta ad accounts linked to a client)
-- ---------------------------------------------------------------------------
create table if not exists nova.ad_accounts (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid references nova.clients(id) on delete cascade,
  meta_ad_account_id text not null unique,
  name               text,
  business_name      text,
  currency           text not null default 'EUR',
  status             text default 'active',
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CAMPAIGNS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- CAMPAIGN METRICS  (daily spend / insights — source for cost-per-lead)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- LEADS  (the people generated by the ads)
-- ---------------------------------------------------------------------------
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
  value_cents      integer,                         -- deal value when converted
  cost_cents       integer,                         -- manual acquisition cost override
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
create index if not exists leads_client_idx  on nova.leads (client_id);
create index if not exists leads_status_idx  on nova.leads (status);
create index if not exists leads_campaign_idx on nova.leads (campaign_id);
create index if not exists leads_created_idx on nova.leads (created_at);
create unique index if not exists leads_meta_idx on nova.leads (meta_lead_id) where meta_lead_id is not null;

-- ---------------------------------------------------------------------------
-- LEAD ACTIVITIES  (timeline)
-- ---------------------------------------------------------------------------
create table if not exists nova.lead_activities (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references nova.leads(id) on delete cascade,
  user_id    uuid references nova.users(id) on delete set null,
  type       text not null,   -- created | note | status_change | message | call | email | assigned | automation
  content    text,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists lead_activities_lead_idx on nova.lead_activities (lead_id, created_at desc);

-- ---------------------------------------------------------------------------
-- MESSAGE TEMPLATES
-- ---------------------------------------------------------------------------
create table if not exists nova.message_templates (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references nova.clients(id) on delete cascade,  -- null = global
  name       text not null,
  channel    text not null default 'whatsapp' check (channel in ('whatsapp','email','sms')),
  subject    text,
  body       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AUTOMATIONS  (trigger + ordered actions stored as jsonb)
-- ---------------------------------------------------------------------------
create table if not exists nova.automations (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid references nova.clients(id) on delete cascade,  -- null = all clients
  name           text not null,
  description    text,
  trigger        text not null check (trigger in ('lead_created','lead_status_changed','no_response')),
  trigger_config jsonb not null default '{}'::jsonb,
  actions        jsonb not null default '[]'::jsonb,   -- [{type, ...}]
  is_active      boolean not null default true,
  run_count      integer not null default 0,
  last_run_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AUTOMATION RUNS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- MESSAGES  (outbound/inbound message log)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- SETTINGS  (key/value, global or per-client)
-- ---------------------------------------------------------------------------
create table if not exists nova.settings (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references nova.clients(id) on delete cascade,  -- null = global
  key        text not null,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (client_id, key)
);
create unique index if not exists settings_global_key_idx on nova.settings (key) where client_id is null;

-- ---------------------------------------------------------------------------
-- WEBHOOK EVENTS  (raw inbound audit/debug)
-- ---------------------------------------------------------------------------
create table if not exists nova.webhook_events (
  id         uuid primary key default gen_random_uuid(),
  source     text not null default 'meta',
  event_type text,
  payload    jsonb not null default '{}'::jsonb,
  processed  boolean not null default false,
  error      text,
  created_at timestamptz not null default now()
);

-- updated_at triggers
drop trigger if exists trg_clients_updated on nova.clients;
create trigger trg_clients_updated   before update on nova.clients          for each row execute function nova.set_updated_at();
drop trigger if exists trg_users_updated on nova.users;
create trigger trg_users_updated     before update on nova.users            for each row execute function nova.set_updated_at();
drop trigger if exists trg_campaigns_updated on nova.campaigns;
create trigger trg_campaigns_updated before update on nova.campaigns        for each row execute function nova.set_updated_at();
drop trigger if exists trg_leads_updated on nova.leads;
create trigger trg_leads_updated     before update on nova.leads            for each row execute function nova.set_updated_at();
drop trigger if exists trg_templates_updated on nova.message_templates;
create trigger trg_templates_updated before update on nova.message_templates for each row execute function nova.set_updated_at();
drop trigger if exists trg_automations_updated on nova.automations;
create trigger trg_automations_updated before update on nova.automations    for each row execute function nova.set_updated_at();
