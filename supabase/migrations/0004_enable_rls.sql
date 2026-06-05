-- Harden the `nova` schema with Row Level Security.
--
-- The app never touches these tables from the browser: all access is server-side
-- via postgres-js using the `postgres` role, which has rolbypassrls = true and is
-- therefore unaffected by RLS. The Supabase JS client is only used for Auth.
--
-- Enabling RLS with no policies makes the public `anon` / `authenticated` API
-- roles deny-by-default, closing the "tables exposed to the anon key" hole while
-- leaving the application fully functional.

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
