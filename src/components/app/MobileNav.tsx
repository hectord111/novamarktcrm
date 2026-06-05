'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navForRole } from './nav';
import { NovaMark } from './Sidebar';
import type { Actor } from '@/lib/types';

export function MobileNav({ actor }: { actor: Actor }) {
  const pathname = usePathname();
  const items = navForRole(actor.role);
  return (
    <div className="sticky top-0 z-20 border-b-2 border-ink bg-ink text-white lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <NovaMark size={15} />
          <span className="font-display text-base tracking-wide text-white">Nova CRM</span>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="rounded-md p-1.5 text-white/60 hover:bg-white/10">
            <LogOut size={16} />
          </button>
        </form>
      </div>
      <nav className="flex gap-1.5 overflow-x-auto px-3 pb-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'whitespace-nowrap rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide',
                active ? 'bg-yellow text-ink' : 'bg-white/10 text-white/70',
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
