// Demo-landing generator for prospects. Pure helpers (usable from client and
// server). Each sector preset fills a complete, good-looking landing that can
// then be hand-tuned per prospect.

export interface LandingService {
  name: string;
  desc: string;
}

export interface LandingConfig {
  color: string; // accent
  emoji: string;
  headline: string;
  subheadline: string;
  about: string;
  services: LandingService[];
  perks: string[];
  cta_label: string;
  hours: string;
}

interface Preset extends Omit<LandingConfig, 'headline' | 'about'> {
  keywords: string[];
  headline: (name: string, city: string) => string;
  about: (name: string, city: string) => string;
}

const ES = (city: string) => city || 'tu zona';

const PRESETS: Preset[] = [
  {
    keywords: ['barber', 'peluquer', 'estetic', 'belleza', 'uñas', 'nail'],
    emoji: '💈',
    color: '#b45309',
    headline: (n) => `${n}: tu mejor versión te espera`,
    subheadline: 'Reserva tu cita en segundos por WhatsApp y sal por la puerta como nuevo.',
    about: (n, c) => `En ${n} llevamos años cuidando el estilo de ${ES(c)}. Trato cercano, puntualidad y un acabado del que presumir.`,
    services: [
      { name: 'Corte y peinado', desc: 'Clásico o moderno, a tu medida' },
      { name: 'Arreglo de barba', desc: 'Perfilado y cuidado completo' },
      { name: 'Color y tratamientos', desc: 'Hidratación, fibra y brillo' },
      { name: 'Cita para eventos', desc: 'Bodas, fotos y ocasiones especiales' },
    ],
    perks: ['Sin esperas: cita por WhatsApp', 'Productos de primera calidad', 'Ambiente de confianza'],
    cta_label: 'Pedir cita',
    hours: 'L–S · 9:30–20:00',
  },
  {
    keywords: ['restaurante', 'bar', 'cafeter', 'pizzer', 'hamburgues', 'tapas', 'asador', 'cocina'],
    emoji: '🍽️',
    color: '#b91c1c',
    headline: (n) => `${n}: cocina que apetece volver a probar`,
    subheadline: 'Producto fresco, raciones generosas y el trato de siempre. Reserva tu mesa por WhatsApp.',
    about: (n, c) => `${n} es ese sitio de ${ES(c)} al que siempre quieres volver: cocina honesta, ingredientes de mercado y sobremesas largas.`,
    services: [
      { name: 'Menú del día', desc: 'Casero, completo y a buen precio' },
      { name: 'Carta y raciones', desc: 'Para compartir sin prisas' },
      { name: 'Reservas de grupo', desc: 'Celebraciones y comidas de empresa' },
      { name: 'Para llevar', desc: 'Tu plato favorito, en casa' },
    ],
    perks: ['Producto fresco de mercado', 'Reserva fácil por WhatsApp', 'Terraza y ambiente familiar'],
    cta_label: 'Reservar mesa',
    hours: 'M–D · 12:30–16:30 / 19:30–23:30',
  },
  {
    keywords: ['fontaner', 'plumber'],
    emoji: '🔧',
    color: '#1d4ed8',
    headline: (n) => `${n}: fontanería urgente y de confianza`,
    subheadline: 'Averías, fugas e instalaciones. Te decimos precio antes de empezar.',
    about: (n, c) => `${n} atiende ${ES(c)} y alrededores con rapidez: diagnóstico claro, presupuesto cerrado y trabajo garantizado.`,
    services: [
      { name: 'Urgencias 24h', desc: 'Fugas y averías al momento' },
      { name: 'Reformas de baño', desc: 'Llave en mano, sin sorpresas' },
      { name: 'Calentadores y calderas', desc: 'Instalación y mantenimiento' },
      { name: 'Desatascos', desc: 'Maquinaria profesional' },
    ],
    perks: ['Presupuesto cerrado por adelantado', 'Garantía por escrito', 'Respuesta en menos de 1 hora'],
    cta_label: 'Pedir presupuesto',
    hours: 'Urgencias 24h · Oficina L–V 9:00–19:00',
  },
  {
    keywords: ['electric'],
    emoji: '⚡',
    color: '#ca8a04',
    headline: (n) => `${n}: electricistas que sí cogen el teléfono`,
    subheadline: 'Boletines, averías, cuadros y domótica. Rápido, limpio y con garantía.',
    about: (n, c) => `${n} resuelve instalaciones y averías eléctricas en ${ES(c)}: trabajo certificado, materiales de primeras marcas y precios claros.`,
    services: [
      { name: 'Averías y urgencias', desc: 'Localizamos y reparamos hoy' },
      { name: 'Boletines eléctricos', desc: 'Certificados oficiales' },
      { name: 'Iluminación LED', desc: 'Ahorra hasta un 60%' },
      { name: 'Cargadores de coche', desc: 'Instalación completa' },
    ],
    perks: ['Instaladores autorizados', 'Presupuesto sin compromiso', 'Garantía en cada trabajo'],
    cta_label: 'Pedir presupuesto',
    hours: 'L–V · 8:00–19:00',
  },
  {
    keywords: ['dental', 'dentista', 'odont'],
    emoji: '🦷',
    color: '#0d9488',
    headline: (n) => `${n}: tu sonrisa, en buenas manos`,
    subheadline: 'Primera visita y diagnóstico sin coste. Financiación a tu medida.',
    about: (n, c) => `En ${n} (${ES(c)}) combinamos tecnología y trato humano: planes claros, sin dolor y con resultados que se notan.`,
    services: [
      { name: 'Primera visita gratis', desc: 'Revisión y plan de tratamiento' },
      { name: 'Implantes', desc: 'Recupera tu sonrisa completa' },
      { name: 'Ortodoncia invisible', desc: 'Alineadores discretos' },
      { name: 'Blanqueamiento', desc: 'Resultados desde la primera sesión' },
    ],
    perks: ['Financiación hasta 36 meses', 'Tecnología 3D de diagnóstico', 'Urgencias el mismo día'],
    cta_label: 'Pedir primera visita',
    hours: 'L–V · 9:30–14:00 / 16:00–20:30',
  },
  {
    keywords: ['fisio', 'osteopat', 'masaj', 'rehabilit'],
    emoji: '💆',
    color: '#0369a1',
    headline: (n) => `${n}: muévete sin dolor`,
    subheadline: 'Fisioterapia personalizada con plan de recuperación desde la primera sesión.',
    about: (n, c) => `${n} ayuda a pacientes de ${ES(c)} a recuperar movilidad y dejar atrás el dolor con tratamientos a medida.`,
    services: [
      { name: 'Fisioterapia deportiva', desc: 'Recupera y previene lesiones' },
      { name: 'Dolor de espalda', desc: 'Cervicales, lumbares y posture' },
      { name: 'Masaje descontracturante', desc: 'Alivio desde la primera sesión' },
      { name: 'Readaptación', desc: 'Vuelve a tu ritmo con seguridad' },
    ],
    perks: ['Valoración inicial incluida', 'Sesiones de 1 hora reales', 'Cita en menos de 48h'],
    cta_label: 'Reservar sesión',
    hours: 'L–V · 9:00–20:30',
  },
  {
    keywords: ['taller', 'mecánic', 'mecanic', 'neumátic', 'neumatic', 'coche', 'auto'],
    emoji: '🚗',
    color: '#374151',
    headline: (n) => `${n}: tu coche, listo y sin sustos`,
    subheadline: 'Mantenimiento, diagnosis y reparación con presupuesto cerrado.',
    about: (n, c) => `${n} es el taller de confianza de ${ES(c)}: te explicamos la avería con claridad y solo cambiamos lo necesario.`,
    services: [
      { name: 'Revisión y mantenimiento', desc: 'Aceite, filtros y puesta a punto' },
      { name: 'Diagnosis electrónica', desc: 'Localizamos el fallo exacto' },
      { name: 'Frenos y neumáticos', desc: 'Montaje y equilibrado' },
      { name: 'Pre-ITV', desc: 'Pasa a la primera' },
    ],
    perks: ['Presupuesto antes de tocar nada', 'Recambios originales o equivalentes', 'Coche listo cuando se promete'],
    cta_label: 'Pedir cita',
    hours: 'L–V · 8:30–18:30',
  },
  {
    keywords: ['reforma', 'construc', 'pintur', 'albañil', 'carpinter'],
    emoji: '🏠',
    color: '#9a3412',
    headline: (n) => `${n}: reformas serias, sin dolores de cabeza`,
    subheadline: 'Presupuesto cerrado, plazos por contrato y obra limpia.',
    about: (n, c) => `${n} reforma viviendas y locales en ${ES(c)} cumpliendo lo prometido: precio, plazo y calidad.`,
    services: [
      { name: 'Reformas integrales', desc: 'Tu casa, de arriba a abajo' },
      { name: 'Baños y cocinas', desc: 'Llave en mano en días' },
      { name: 'Pintura y acabados', desc: 'Resultado impecable' },
      { name: 'Locales comerciales', desc: 'Abre tu negocio a tiempo' },
    ],
    perks: ['Plazos firmados por contrato', 'Obra limpia día a día', 'Garantía postobra'],
    cta_label: 'Pedir presupuesto',
    hours: 'L–V · 8:00–18:00',
  },
  {
    keywords: ['limpieza', 'cleaning'],
    emoji: '✨',
    color: '#0e7490',
    headline: (n) => `${n}: limpieza profesional que se nota`,
    subheadline: 'Hogares, oficinas y comunidades. Personal de confianza y resultado impecable.',
    about: (n, c) => `${n} cuida espacios en ${ES(c)} con equipos propios, productos profesionales y total flexibilidad de horarios.`,
    services: [
      { name: 'Limpieza de hogar', desc: 'Puntual o por horas semanales' },
      { name: 'Oficinas y locales', desc: 'Fuera de tu horario laboral' },
      { name: 'Cristales y fin de obra', desc: 'Acabado perfecto' },
      { name: 'Comunidades', desc: 'Portales y zonas comunes' },
    ],
    perks: ['Personal asegurado y de confianza', 'Productos profesionales incluidos', 'Presupuesto en 24h'],
    cta_label: 'Pedir presupuesto',
    hours: 'L–S · 8:00–20:00',
  },
  {
    keywords: ['abogad', 'asesor', 'gestor', 'consultor', 'seguro'],
    emoji: '⚖️',
    color: '#1e3a8a',
    headline: (n) => `${n}: tus asuntos, resueltos con claridad`,
    subheadline: 'Primera consulta orientativa gratuita. Te explicamos tu caso sin jerga.',
    about: (n, c) => `${n} acompaña a particulares y pymes de ${ES(c)} con respuestas claras, honorarios transparentes y seguimiento constante.`,
    services: [
      { name: 'Consulta inicial', desc: 'Analizamos tu caso sin coste' },
      { name: 'Trámites y gestiones', desc: 'Nos ocupamos del papeleo' },
      { name: 'Pymes y autónomos', desc: 'Asesoría integral mensual' },
      { name: 'Reclamaciones', desc: 'Defendemos lo que es tuyo' },
    ],
    perks: ['Honorarios claros desde el inicio', 'Respuesta en 24h laborables', 'Trato directo, sin intermediarios'],
    cta_label: 'Pedir consulta',
    hours: 'L–V · 9:00–14:00 / 16:30–19:30',
  },
];

const GENERIC: Omit<Preset, 'keywords'> = {
  emoji: '⭐',
  color: '#4f46e5',
  headline: (n) => `${n}: el negocio de confianza de tu zona`,
  subheadline: 'Atención cercana, trabajo bien hecho y respuesta rápida por WhatsApp.',
  about: (n, c) => `${n} lleva tiempo haciendo las cosas bien en ${ES(c)}. Ahora también nos encuentras online: escríbenos y te atendemos al momento.`,
  services: [
    { name: 'Atención personalizada', desc: 'Hablas directamente con nosotros' },
    { name: 'Presupuesto sin compromiso', desc: 'Claro y por adelantado' },
    { name: 'Servicio en tu zona', desc: 'Cerca de ti, cuando lo necesitas' },
    { name: 'Calidad garantizada', desc: 'Clientes que repiten y recomiendan' },
  ],
  perks: ['Respuesta rápida por WhatsApp', 'Años de experiencia', 'Trato directo y honesto'],
  cta_label: 'Contactar ahora',
  hours: 'L–V · 9:00–19:00',
};

function deaccent(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Build a complete landing config from business name + sector + city. */
export function buildLanding(name: string, sector: string | null, city: string | null): LandingConfig {
  const key = deaccent(`${sector ?? ''} ${name}`);
  const preset = PRESETS.find((p) => p.keywords.some((k) => key.includes(k))) ?? { ...GENERIC, keywords: [] };
  return {
    color: preset.color,
    emoji: preset.emoji,
    headline: preset.headline(name, city ?? ''),
    subheadline: preset.subheadline,
    about: preset.about(name, city ?? ''),
    services: preset.services,
    perks: preset.perks,
    cta_label: preset.cta_label,
    hours: preset.hours,
  };
}

export function slugifyLanding(name: string, city?: string | null) {
  const base = `${name} ${city ?? ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
  return base || 'negocio';
}

/** Digits-only phone for wa.me; Spanish 9-digit numbers get the 34 prefix. */
export function waPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 9 && /^[6789]/.test(d)) d = `34${d}`;
  return d;
}

/** Default WhatsApp pitch for a prospect, with the demo-landing link. */
export function buildPitch(businessName: string, city: string | null, landingUrl: string) {
  const where = city ? ` en ${city}` : '';
  return (
    `¡Hola! 👋 Soy Héctor, de Nova Marketing. Buscando negocios${where} vimos que ${businessName} ` +
    `aún no tiene página web, así que os hemos preparado una *de muestra* (gratis, sin compromiso) ` +
    `para que veáis cómo podría quedar:\n\n${landingUrl}\n\n` +
    `Si os gusta, la dejamos lista con vuestro dominio propio en 48h. ¿Qué os parece? 🙂`
  );
}
