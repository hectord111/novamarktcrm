-- Nova Marketing CRM — preset library (plantillas de anuncios preconfiguradas)
-- Safe to run once; skips if presets already exist.

-- Link the real Facebook Page to the Dialez ad accounts (for ad creatives)
update nova.ad_accounts set page_id = '692272967297257', page_name = 'Dialez Properties'
where meta_ad_account_id in ('1736528837734217','1394956658317811') and page_id is null;

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
