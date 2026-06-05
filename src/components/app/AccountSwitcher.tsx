'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, Building2 } from 'lucide-react';

export interface AccountChoice {
  value: string;
  label: string;
  internal?: boolean;
}

/**
 * Account picker used on the Panel and Leads. Changing it updates `?account=`
 * (resetting pagination) while keeping the other query params intact.
 */
export function AccountSwitcher({ choices, current }: { choices: AccountChoice[]; current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(Array.from(sp.entries()));
    params.set('account', value);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative inline-flex items-center">
      <Building2 size={15} className="pointer-events-none absolute left-2.5 text-ink/50" />
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Cuenta"
        className="h-10 cursor-pointer appearance-none rounded-md border-2 border-ink bg-white pl-8 pr-9 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-yellow"
      >
        {choices.map((c) => (
          <option key={c.value} value={c.value}>
            {c.internal ? `★ ${c.label}` : c.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-2.5 text-ink/50" />
    </div>
  );
}
