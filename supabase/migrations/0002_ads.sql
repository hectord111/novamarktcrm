-- Nova Marketing CRM — Ad builder (creación de anuncios con plantillas preconfiguradas)

-- Page used for ad creatives (object_story_spec.page_id)
alter table nova.ad_accounts add column if not exists page_id text;
alter table nova.ad_accounts add column if not exists page_name text;

-- Reusable, preconfigured ad templates
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
  description_text    text,
  is_global          boolean not null default true,
  client_id          uuid references nova.clients(id) on delete cascade,
  created_at         timestamptz not null default now()
);

-- Ads created from the builder (saved as draft, then published to Meta as PAUSED)
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
  description_text    text,
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

drop trigger if exists trg_ads_updated on nova.ads;
create trigger trg_ads_updated before update on nova.ads for each row execute function nova.set_updated_at();

-- keep the schema private
revoke all on nova.ad_presets from anon, authenticated;
revoke all on nova.ads from anon, authenticated;
