'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navForRole } from './nav';
import type { Actor } from '@/lib/types';

export function MobileNav({ actor }: { actor: Actor }) {
  const pathname = usePathname();
  const items = navForRole(actor.role);
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sparkles size={16} />
          </span>
          <span className="text-sm font-semibold text-slate-900">Nova CRM</span>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
            <LogOut size={16} />
          </button>
        </form>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium',
                active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
