'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button, Input, Label } from '@/components/ui';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'ok'; text: string } | null>(null);
  const supabase = createSupabaseBrowserClient();

  const redirectTo = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
        if (error) throw error;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.push(next);
          router.refresh();
        } else {
          setMsg({ type: 'ok', text: 'Cuenta creada. Revisa tu email para confirmar y vuelve a entrar.' });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error al iniciar sesión' });
    } finally {
      setLoading(false);
    }
  }

  async function handleMagic() {
    if (!email) {
      setMsg({ type: 'error', text: 'Escribe tu email primero.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setLoading(false);
    setMsg(error ? { type: 'error', text: error.message } : { type: 'ok', text: 'Te hemos enviado un enlace de acceso a tu email ✉️' });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-3 inline-flex items-center justify-center rounded-md border-2 border-ink bg-yellow p-2 text-ink">
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M12 3.5v17M4.5 7.75l15 8.5M19.5 7.75l-15 8.5" />
          </svg>
        </span>
        <h1 className="font-display text-2xl text-ink">Nova Marketing CRM</h1>
        <p className="mt-1 text-sm text-ink/55">
          {mode === 'signin' ? 'Inicia sesión para gestionar tus leads' : 'Crea tu cuenta de Nova Marketing'}
        </p>
      </div>

      <form onSubmit={handlePassword} className="space-y-4 rounded-lg border-2 border-ink bg-white p-6 shadow-[6px_6px_0_#e5ff00]">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {msg && (
          <p className={cn('rounded-lg px-3 py-2 text-xs', msg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>
            {msg.text}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Un momento…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
        </Button>

        <div className="relative py-1 text-center">
          <span className="bg-white px-2 text-xs font-bold uppercase tracking-wide text-ink/40">o</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-ink/10" />
        </div>

        <Button type="button" variant="outline" disabled={loading} onClick={handleMagic} className="w-full">
          <Mail size={16} /> Enviar enlace mágico
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        {mode === 'signin' ? '¿Aún no tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
        <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="font-medium text-brand-700 hover:underline">
          {mode === 'signin' ? 'Crear una' : 'Inicia sesión'}
        </button>
      </p>
    </div>
  );
}
