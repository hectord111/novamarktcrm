'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import { ROLE_LABELS } from '@/lib/domain';
import { navForRole } from './nav';
import type { Actor } from '@/lib/types';

export function Sidebar({ actor, clientName }: { actor: Actor; clientName?: string | null }) {
  const pathname = usePathname();
  const items = navForRole(actor.role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <Sparkles size={18} />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">Nova Marketing</div>
          <div className="text-[11px] text-slate-400">CRM</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon size={18} className={active ? 'text-brand-600' : 'text-slate-400'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={actor.full_name || actor.email} size={36} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-900">{actor.full_name || actor.email}</div>
            <div className="truncate text-xs text-slate-400">
              {actor.role === 'client' ? clientName || 'Cliente' : ROLE_LABELS[actor.role]}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" title="Cerrar sesión" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
