import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Phone, MapPin, Clock, Star, Check, MessageCircle } from 'lucide-react';
import { getProspectBySlug } from '@/lib/data/prospects';
import { waPhone } from '@/lib/landing';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProspectBySlug(slug);
  if (!p) return { title: 'Página no encontrada' };
  return {
    title: `${p.business_name}${p.city ? ` · ${p.city}` : ''}`,
    description: p.landing.subheadline,
    robots: { index: false, follow: false }, // demo page — keep out of Google
  };
}

export default async function DemoLandingPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProspectBySlug(slug);
  if (!p) notFound();

  const L = p.landing;
  const wa = waPhone(p.phone);
  const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola, os escribo desde la web de ${p.business_name}. `)}` : null;
  const telHref = p.phone ? `tel:${p.phone.replace(/[^\d+]/g, '')}` : null;
  const accent = L.color || '#4f46e5';

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900" style={{ ['--acc' as string]: accent }}>
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight">
            <span aria-hidden>{L.emoji}</span> {p.business_name}
          </span>
          {telHref && (
            <a href={telHref} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-white" style={{ background: accent }}>
              <Phone size={13} /> Llamar
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pb-12 pt-12 text-center" style={{ background: `linear-gradient(180deg, ${accent}14, transparent)` }}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 text-5xl" aria-hidden>{L.emoji}</div>
          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{L.headline}</h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-zinc-600 sm:text-lg">{L.subheadline}</p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {waHref && (
              <a href={waHref} className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/25 transition-transform hover:scale-[1.03]">
                <MessageCircle size={17} /> {L.cta_label} por WhatsApp
              </a>
            )}
            {telHref && (
              <a href={telHref} className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold transition-colors" style={{ borderColor: accent, color: accent }}>
                <Phone size={16} /> {p.phone}
              </a>
            )}
          </div>

          {p.rating != null && (
            <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              {Number(p.rating).toLocaleString('es-ES', { minimumFractionDigits: 1 })}
              {p.reviews_count ? <span className="font-normal text-zinc-500">· {p.reviews_count} reseñas en Google</span> : null}
            </p>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">¿Qué hacemos por ti?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {L.services.map((s) => (
            <div key={s.name} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <h3 className="font-bold">{s.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section className="bg-zinc-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight">Por qué elegirnos</h2>
          <ul className="mx-auto mt-7 grid max-w-xl gap-3">
            {L.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: accent }}>
                  <Check size={14} className="text-white" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* About + contact */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Sobre nosotros</h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-600">{L.about}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
            <h3 className="font-bold">Contacto</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-zinc-600">
              {p.address && <li className="flex items-start gap-2.5"><MapPin size={15} className="mt-0.5 shrink-0" style={{ color: accent }} />{p.address}</li>}
              {p.phone && <li className="flex items-center gap-2.5"><Phone size={15} className="shrink-0" style={{ color: accent }} />{p.phone}</li>}
              {L.hours && <li className="flex items-center gap-2.5"><Clock size={15} className="shrink-0" style={{ color: accent }} />{L.hours}</li>}
            </ul>
            {waHref && (
              <a href={waHref} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white">
                <MessageCircle size={16} /> Escríbenos por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {waHref && (
        <section className="px-4 pb-14">
          <div className="mx-auto max-w-3xl rounded-3xl px-6 py-10 text-center text-white" style={{ background: accent }}>
            <h2 className="text-2xl font-extrabold tracking-tight">¿Hablamos?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm opacity-90">Respondemos rápido. Cuéntanos qué necesitas y te atendemos al momento.</p>
            <a href={waHref} className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold" style={{ color: accent }}>
              <MessageCircle size={16} /> {L.cta_label}
            </a>
          </div>
        </section>
      )}

      {/* Nova badge */}
      <footer className="border-t border-zinc-100 px-4 py-6 text-center">
        <p className="text-xs text-zinc-400">
          © {new Date().getFullYear()} {p.business_name} · Web de muestra creada por{' '}
          <span className="font-bold text-zinc-600">Nova Marketing</span> — ¿te gustaría tenerla? Responde a nuestro WhatsApp 🙂
        </p>
      </footer>
    </div>
  );
}
