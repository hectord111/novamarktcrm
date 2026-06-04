import { Sparkles } from 'lucide-react';
import { dbConfigured } from '@/lib/db';
import { supabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const VARS = [
  ['NEXT_PUBLIC_SUPABASE_URL', 'URL del proyecto Supabase (Settings → API).'],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Clave pública / anon (Settings → API).'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'Service role (Settings → API). Solo servidor: invitar usuarios.'],
  ['DATABASE_URL', 'Connection string de Postgres (Settings → Database) → datos del CRM.'],
  ['WHATSAPP_ACCESS_TOKEN', 'Opcional. Token de WhatsApp Cloud API para enviar mensajes reales.'],
  ['WHATSAPP_PHONE_NUMBER_ID', 'Opcional. ID del número de WhatsApp emisor.'],
  ['META_ACCESS_TOKEN', 'Opcional. Token de Meta Marketing API para sincronizar campañas.'],
];

export default function SetupPage() {
  const ok = dbConfigured() && supabaseConfigured();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white">
          <Sparkles size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Configura Nova Marketing CRM</h1>
          <p className="text-sm text-slate-500">Define estas variables de entorno en <code className="rounded bg-slate-100 px-1">.env.local</code> (o en Vercel) y reinicia.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {VARS.map(([name, desc], i) => (
          <div key={name} className={`flex flex-col gap-1 px-5 py-3.5 ${i ? 'border-t border-slate-100' : ''}`}>
            <code className="text-sm font-semibold text-brand-700">{name}</code>
            <span className="text-xs text-slate-500">{desc}</span>
          </div>
        ))}
      </div>

      <div className={`mt-6 rounded-xl px-4 py-3 text-sm ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        {ok ? '✅ Conexión configurada. Ve a /login para entrar.' : '⏳ Faltan variables obligatorias (Supabase URL/Anon + DATABASE_URL).'}
      </div>
    </div>
  );
}
