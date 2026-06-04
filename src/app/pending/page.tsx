import { Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Clock size={22} />
        </span>
        <h1 className="text-lg font-semibold text-slate-900">Acceso pendiente</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tu cuenta se ha creado pero todavía no tiene acceso. El equipo de Nova Marketing debe asignarte un rol o un cliente.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button type="submit" className="text-sm font-medium text-brand-700 hover:underline">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
