-- Nova Marketing CRM — demo seed data
-- Safe to run once on an empty database. Re-running is a no-op (skips if clients exist).
-- Generates realistic clients, ad accounts, campaigns, 30 days of spend metrics,
-- ~300 leads across the funnel, message templates, automations and message history.

do $$
declare
  v_dialez uuid;
  v_barber uuid;
  v_dental uuid;
  v_camps  uuid[];
  rec      record;
  fnames text[] := array['Lucía','Martín','Sofía','Hugo','Paula','Daniel','María','Pablo','Carmen','Javier',
                         'Laura','Sergio','Marta','Alejandro','Andrea','David','Sara','Carlos','Elena','Adrián',
                         'Nuria','Rubén','Cristina','Iván','Patricia','Jorge','Alba','Raúl','Beatriz','Óscar'];
  lnames text[] := array['García','Martínez','López','Sánchez','Pérez','Gómez','Fernández','Ruiz','Díaz','Moreno',
                         'Álvarez','Romero','Torres','Navarro','Gil','Vázquez','Serrano','Ramos','Molina','Ortega'];
  welcome text := '¡Hola {{nombre}}! 👋 Gracias por tu interés en {{cliente}}. Para poder ayudarte mejor, ¿podrías contarnos un poco más sobre lo que estás buscando? Cuéntanos qué necesitas y un asesor te responderá enseguida. 🙌';
begin
  if exists (select 1 from nova.clients) then
    raise notice 'Seed skipped: clients already exist.';
    return;
  end if;

  -- ----- CLIENTS -----
  insert into nova.clients (name, slug, industry, contact_name, contact_email, contact_phone, monthly_fee_cents, color, status, meta_business_id)
  values ('Dialez Properties','dialez','Inmobiliaria','Héctor D.','contacto@dialezproperties.es','+34600111222', 120000, '#2563eb','active','1694431894501639')
  returning id into v_dialez;

  insert into nova.clients (name, slug, industry, contact_name, contact_email, contact_phone, monthly_fee_cents, color, status, meta_business_id)
  values ('Barber Booster','barber','Barbería','Equipo Prodlabz','hola@barberbooster.es','+34600333444', 60000, '#f59e0b','active','774828692290140')
  returning id into v_barber;

  insert into nova.clients (name, slug, industry, contact_name, contact_email, contact_phone, monthly_fee_cents, color, status)
  values ('Clínica Dental Sonrisa','sonrisa','Clínica dental','Dra. Gómez','info@clinicasonrisa.es','+34600555666', 90000, '#0d9488','active')
  returning id into v_dental;

  -- ----- AD ACCOUNTS (real Meta ids reachable via the connected account) -----
  insert into nova.ad_accounts (client_id, meta_ad_account_id, name, business_name, currency) values
    (v_dialez,'1736528837734217','Dialez Properties Publicidad','Dialez Properties','EUR'),
    (v_dialez,'1394956658317811','Dialez Publicidad','Dialez Properties','EUR'),
    (v_barber,'1402902838555348','Barberbooster','Prodlabz','EUR');

  -- ----- CAMPAIGNS -----
  insert into nova.campaigns (client_id, ad_account_id, name, objective, channel, status, daily_budget_cents, started_at, meta_campaign_id)
  select v_dialez, (select id from nova.ad_accounts where meta_ad_account_id='1736528837734217'),
         c.name,'OUTCOME_LEADS','meta','active', c.b, current_date - 45, c.m
  from (values ('[Dialez] Compradores Costa Blanca',4000,'cmp_dlz_1'),
               ('[Dialez] Vende tu casa · Valoración gratis',3000,'cmp_dlz_2'),
               ('[Dialez] Alquiler larga temporada',2000,'cmp_dlz_3')) c(name,b,m);

  insert into nova.campaigns (client_id, ad_account_id, name, objective, channel, status, daily_budget_cents, started_at, meta_campaign_id)
  select v_barber, (select id from nova.ad_accounts where meta_ad_account_id='1402902838555348'),
         c.name,'OUTCOME_LEADS','meta','active', c.b, current_date - 45, c.m
  from (values ('[Barber] Corte + Barba 9,90€',1500,'cmp_brb_1'),
               ('[Barber] Apertura nuevo local',1200,'cmp_brb_2'),
               ('[Barber] Suscripción mensual',1000,'cmp_brb_3')) c(name,b,m);

  insert into nova.campaigns (client_id, name, objective, channel, status, daily_budget_cents, started_at, meta_campaign_id)
  select v_dental, c.name,'OUTCOME_LEADS','meta','active', c.b, current_date - 45, c.m
  from (values ('[Dental] Primera visita gratis',2500,'cmp_dnt_1'),
               ('[Dental] Implantes dentales',2000,'cmp_dnt_2'),
               ('[Dental] Ortodoncia invisible',1800,'cmp_dnt_3')) c(name,b,m);

  -- ----- 30 DAYS OF DAILY METRICS PER CAMPAIGN -----
  insert into nova.campaign_metrics (campaign_id, date, spend_cents, impressions, clicks, leads_count)
  select c.id, g::date,
         greatest(0, round(coalesce(c.daily_budget_cents,2000) * (0.6 + random()*0.5)))::int,
         (800 + random()*5000)::int,
         (15 + random()*160)::int,
         (random()*6)::int
  from nova.campaigns c
  cross join generate_series(current_date - 29, current_date, interval '1 day') g;

  -- ----- LEADS PER CLIENT -----
  for rec in
    select * from (values
      (v_dialez,  90, 300000, 900000),   -- inmobiliaria: comisiones altas
      (v_barber, 140,  18000, 120000),   -- barbería: ticket/suscripción
      (v_dental,  70,  80000, 400000)    -- dental: tratamientos
    ) as t(cid, n, dmin, dmax)
  loop
    select array_agg(id) into v_camps from nova.campaigns where client_id = rec.cid;

    insert into nova.leads (client_id, campaign_id, full_name, email, phone, status, source,
                            value_cents, first_contact_at, converted_at, lost_reason, created_at, utm_source, utm_medium, utm_campaign)
    select
      rec.cid,
      v_camps[1 + floor(random()*array_length(v_camps,1))::int],
      s.fn || ' ' || s.ln,
      lower(translate(s.fn,'áéíóúñ','aeioun')) || '.' || lower(translate(s.ln,'áéíóúñ','aeioun')) || floor(random()*900+100)::text || '@gmail.com',
      '+346' || (10000000 + floor(random()*89999999))::bigint::text,
      k.st,
      (array['meta_lead_ad','meta_lead_ad','meta_lead_ad','instagram','facebook'])[1+floor(random()*5)::int],
      case when k.st = 'converted' then (rec.dmin + floor(random()*(rec.dmax-rec.dmin)))::int end,
      case when k.st in ('contacted','qualified','converted','lost') then s.created_ts + interval '90 minutes' end,
      case when k.st = 'converted' then s.created_ts + (2 + random()*6) * interval '1 day' end,
      case when k.st = 'lost' then (array['No contesta','Fuera de zona','Sin presupuesto','Solo curioseaba'])[1+floor(random()*4)::int] end,
      s.created_ts,
      'meta','paid_social','lead_form'
    from (
      select
        fnames[1+floor(random()*array_length(fnames,1))::int] as fn,
        lnames[1+floor(random()*array_length(lnames,1))::int] as ln,
        (now() - (random()*30) * interval '1 day') as created_ts,
        random() as r
      from generate_series(1, rec.n)
    ) s
    cross join lateral (
      select case
        when s.r < 0.27 then 'new'
        when s.r < 0.52 then 'contacted'
        when s.r < 0.72 then 'qualified'
        when s.r < 0.85 then 'converted'
        else 'lost' end as st
    ) k;
  end loop;

  -- ----- ACTIVITY: "created" for every lead -----
  insert into nova.lead_activities (lead_id, type, content, created_at)
  select id, 'created', 'Lead recibido desde ' || source, created_at from nova.leads;

  -- ----- AUTO WHATSAPP WELCOME for every lead that moved past "new" -----
  insert into nova.messages (lead_id, client_id, channel, direction, to_address, body, status, provider, sent_at, created_at)
  select l.id, l.client_id, 'whatsapp','outbound', l.phone,
         replace(replace(welcome,'{{nombre}}', split_part(l.full_name,' ',1)),'{{cliente}}', c.name),
         'simulated','simulation', l.created_at + interval '3 minutes', l.created_at + interval '3 minutes'
  from nova.leads l join nova.clients c on c.id = l.client_id
  where l.status <> 'new';

  insert into nova.lead_activities (lead_id, type, content, created_at)
  select lead_id, 'message', 'WhatsApp de bienvenida enviado automáticamente', sent_at
  from nova.messages where channel='whatsapp';

  insert into nova.lead_activities (lead_id, type, content, created_at)
  select id, 'status_change', 'Estado cambiado a Cliente cerrado 🎉', converted_at
  from nova.leads where status='converted';

  -- ----- MESSAGE TEMPLATES -----
  insert into nova.message_templates (client_id, name, channel, body) values
    (null, 'Bienvenida (genérica)', 'whatsapp', welcome),
    (v_dialez, 'Bienvenida inmobiliaria', 'whatsapp', '¡Hola {{nombre}}! 👋 Gracias por contactar con Dialez Properties. ¿Buscas comprar, vender o alquilar? Cuéntanos qué tipo de inmueble te interesa (zona, habitaciones y presupuesto) y te enviamos opciones a medida. 🏡'),
    (v_barber, 'Bienvenida barbería', 'whatsapp', '¡Hola {{nombre}}! 💈 Gracias por tu interés. ¿Para qué día y hora te gustaría tu cita? Responde con tu preferencia y te confirmamos al momento. ✂️'),
    (v_dental, 'Bienvenida dental', 'whatsapp', '¡Hola {{nombre}}! 🦷 Gracias por contactar con Clínica Dental Sonrisa. ¿Qué tratamiento te interesa y qué día te vendría bien una primera visita gratuita? Te ayudamos enseguida.');

  -- ----- AUTOMATIONS -----
  insert into nova.automations (client_id, name, description, trigger, trigger_config, actions, is_active, run_count, last_run_at)
  values
    (null, 'Bienvenida WhatsApp a leads nuevos',
     'Cuando entra un lead nuevo, envía automáticamente un WhatsApp pidiéndole que explique mejor qué necesita.',
     'lead_created', '{}'::jsonb,
     jsonb_build_array(jsonb_build_object('type','send_whatsapp','delay_minutes',2,'template_name','Bienvenida (genérica)','body', welcome)),
     true,
     (select count(*) from nova.messages where channel='whatsapp'),
     now() - interval '2 hours'),
    (null, 'Recordatorio si no responde (24h)',
     'Si un lead sigue en estado Nuevo o Contactado 24h después, envía un segundo WhatsApp de recordatorio.',
     'no_response', jsonb_build_object('hours',24,'statuses', jsonb_build_array('new','contacted')),
     jsonb_build_array(jsonb_build_object('type','send_whatsapp','delay_minutes',0,'body','Hola {{nombre}}, ¿pudiste ver nuestro mensaje? Seguimos aquí para ayudarte con lo que necesites de {{cliente}} 😊')),
     true, 0, null);

  -- ----- DEFAULT GLOBAL SETTINGS -----
  insert into nova.settings (client_id, key, value) values
    (null, 'whatsapp', jsonb_build_object('mode','simulation','provider','whatsapp_cloud','phone_number_id','','from','')),
    (null, 'meta',     jsonb_build_object('connected', true, 'note','Tokens via env vars (META_ACCESS_TOKEN)')),
    (null, 'branding', jsonb_build_object('agency_name','Nova Marketing','primary','#6d28d9'));

  raise notice 'Seed completed.';
end $$;