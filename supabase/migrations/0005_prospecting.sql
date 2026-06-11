-- Prospección: businesses without a website that Nova wants to win as clients.
-- Each prospect gets an auto-generated demo landing page (served publicly at
-- /l/[slug]) and a WhatsApp pitch. When they reply, they convert into a lead
-- of the internal Nova account.

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
  status          text not null default 'new'
                  check (status in ('new','contacted','replied','interested','converted','discarded')),
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

drop trigger if exists trg_prospects_updated on nova.prospects;
create trigger trg_prospects_updated before update on nova.prospects
  for each row execute function nova.set_updated_at();

alter table nova.prospects enable row level security;
