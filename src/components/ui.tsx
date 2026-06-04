import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-2xl border border-slate-200/70 bg-white shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = 'slate' | 'brand' | 'green' | 'amber' | 'red' | 'sky' | 'violet';
const toneClasses: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-600/15',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

export function Badge({ tone = 'slate', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', toneClasses[tone], className)}>
      {children}
    </span>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md';

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md') {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40';
  const sizes: Record<Size, string> = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm' };
  const variants: Record<Variant, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
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
    <label className={cn('mb-1.5 block text-xs font-medium text-slate-600', className)} {...props}>
      {children}
    </label>
  );
}

const fieldClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

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
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color || '#7c3aed', fontSize: size * 0.38 }}
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
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-semibold tracking-tight text-slate-900">{value}</span>
        {delta !== undefined && delta !== null && <Delta value={delta} goodWhenDown={goodWhenDown} />}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

export function Delta({ value, goodWhenDown = false }: { value: number; goodWhenDown?: boolean }) {
  const up = value >= 0;
  const positive = goodWhenDown ? !up : up;
  const pct = `${up ? '+' : ''}${Math.round(value * 100)}%`;
  return (
    <span
      className={cn(
        'mb-1 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold',
        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
      )}
    >
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {pct}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
