'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import { ROLE_LABELS } from '@/lib/domain';
import { navForRole } from './nav';
import type { Actor } from '@/lib/types';

export function NovaMark({ size = 18 }: { size?: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md border-2 border-ink bg-yellow p-1 text-ink">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <path d="M12 3.5v17M4.5 7.75l15 8.5M19.5 7.75l-15 8.5" />
      </svg>
    </span>
  );
}

export function Sidebar({ actor, clientName }: { actor: Actor; clientName?: string | null }) {
  const pathname = usePathname();
  const items = navForRole(actor.role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-ink text-white lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <NovaMark />
        <div className="leading-tight">
          <div className="font-display text-base tracking-wide text-white">Nova Marketing</div>
          <div className="nm-label text-yellow">CRM</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold transition-colors',
                active ? 'bg-yellow text-ink' : 'text-white/60 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon size={18} className={active ? 'text-ink' : 'text-white/50'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar name={actor.full_name || actor.email} size={36} color="#3f3f46" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{actor.full_name || actor.email}</div>
            <div className="truncate text-xs text-white/40">
              {actor.role === 'client' ? clientName || 'Cliente' : ROLE_LABELS[actor.role]}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" title="Cerrar sesión" className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
