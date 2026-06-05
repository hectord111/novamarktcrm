import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-lg border-2 border-ink/10 bg-white', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-2 border-ink/8 px-5 py-4">
      <div>
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink/50">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = 'slate' | 'brand' | 'green' | 'amber' | 'red' | 'sky' | 'violet';
const toneClasses: Record<Tone, string> = {
  slate: 'bg-ink/5 text-ink/70 ring-ink/10',
  brand: 'bg-yellow text-ink ring-ink/20',
  violet: 'bg-yellow text-ink ring-ink/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/30',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

export function Badge({ tone = 'slate', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'accent';
type Size = 'sm' | 'md';

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md') {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-bold uppercase tracking-wider transition-all duration-100 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-1';
  const sizes: Record<Size, string> = { sm: 'h-8 px-3 text-[11px]', md: 'h-10 px-4 text-xs' };
  const variants: Record<Variant, string> = {
    primary:
      'border-2 border-ink bg-ink text-white shadow-[4px_4px_0_#e5ff00] hover:bg-yellow hover:text-ink hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
    accent:
      'border-2 border-ink bg-yellow text-ink shadow-[4px_4px_0_#0b0b0b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
    secondary: 'border-2 border-ink bg-ink text-white hover:bg-zinc-800',
    outline: 'border-2 border-ink bg-white text-ink hover:bg-yellow',
    ghost: 'text-ink/70 hover:bg-ink/5',
    danger: 'border-2 border-rose-600 bg-rose-600 text-white hover:bg-rose-700',
  };
  return cn(base, sizes[size], variants[variant]);
}

export function Button({
  variant,
  size,
  href,
  className,
  children,
  ...props
}: { variant?: Variant; size?: Size; href?: string } & ComponentProps<'button'>) {
  const cls = cn(buttonClasses(variant, size), className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}

export function Label({ className, children, ...props }: ComponentProps<'label'>) {
  return (
    <label className={cn('mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-ink/60', className)} {...props}>
      {children}
    </label>
  );
}

const fieldClasses =
  'w-full rounded-md border-2 border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none focus:ring-2 focus:ring-yellow';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldClasses, 'min-h-[90px]', className)} {...props} />;
}
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select className={cn(fieldClasses, 'appearance-none pr-8', className)} {...props}>
      {children}
    </select>
  );
}

export function Avatar({ name, color, size = 36 }: { name: string; color?: string | null; size?: number }) {
  const text = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md border-2 border-ink/80 font-bold text-white"
      style={{ width: size, height: size, background: color || '#0b0b0b', fontSize: size * 0.36 }}
    >
      {text || '?'}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  delta,
  goodWhenDown = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  delta?: number | null;
  goodWhenDown?: boolean;
}) {
  return (
    <div className="rounded-lg border-2 border-ink bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="nm-label text-ink/55">{label}</span>
        {icon && <span className="text-ink/40">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-display text-3xl text-ink">{value}</span>
        {delta !== undefined && delta !== null && <Delta value={delta} goodWhenDown={goodWhenDown} />}
      </div>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}

export function Delta({ value, goodWhenDown = false }: { value: number; goodWhenDown?: boolean }) {
  const up = value >= 0;
  const positive = goodWhenDown ? !up : up;
  const pct = `${up ? '+' : ''}${Math.round(value * 100)}%`;
  return (
    <span
      className={cn(
        'mb-1.5 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold',
        positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
      )}
    >
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {pct}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl tracking-tight text-ink sm:text-[1.75rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/55">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink/20 bg-white/60 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-ink/25">{icon}</div>}
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink/55">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
