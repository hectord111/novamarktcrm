'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' },
];

export function PeriodSelector({ current }: { current: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function select(days: number) {
    const sp = new URLSearchParams(params.toString());
    sp.set('days', String(days));
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
      {OPTIONS.map((o) => (
        <button
          key={o.days}
          onClick={() => select(o.days)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            current === o.days ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
