-- Nova Marketing CRM — internal "Nova" account.
-- Adds a `kind` to clients so the agency's OWN client-acquisition (leads, ads,
-- campaigns, spend) lives in a dedicated internal account, separate from the
-- real clients whose lead-gen Nova manages.

alter table nova.clients add column if not exists kind text not null default 'client';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clients_kind_check') then
    alter table nova.clients add constraint clients_kind_check check (kind in ('client', 'internal'));
  end if;
end $$;

-- The single internal account that represents Nova itself.
insert into nova.clients (name, slug, kind, industry, contact_name, contact_email, color, status, monthly_fee_cents)
select 'Nova Marketing', 'nova', 'internal', 'Agencia de marketing', 'Nova Marketing', 'contacto@dialezproperties.es', '#0b0b0b', 'active', 0
where not exists (select 1 from nova.clients where kind = 'internal');
