const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const eur0 = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('es-ES');
const pct = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 });

/** Format a value stored in cents as euros, e.g. 123456 -> "1.234,56 €". */
export function formatCents(cents: number | null | undefined, compact = false) {
  const v = (cents ?? 0) / 100;
  return compact ? eur0.format(v) : eur.format(v);
}

export function formatEuros(value: number | null | undefined) {
  return eur.format(value ?? 0);
}

export function formatNumber(n: number | null | undefined) {
  return num.format(n ?? 0);
}

/** Ratio in [0,1] -> percentage. */
export function formatPercent(ratio: number | null | undefined) {
  if (ratio === null || ratio === undefined || !isFinite(ratio)) return '—';
  return pct.format(ratio);
}

export function formatDate(d: string | Date | null | undefined, withTime = false) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/** Short relative time, e.g. "hace 3 h". */
export function timeAgo(d: string | Date | null | undefined) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  const secs = Math.round((Date.now() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.35, 'week'], [12, 'month'], [Infinity, 'year'],
  ];
  let unitAmount = secs;
  let i = 0;
  for (; i < steps.length; i++) {
    if (Math.abs(unitAmount) < steps[i][0]) break;
    unitAmount /= steps[i][0];
  }
  return rtf.format(-Math.round(unitAmount), steps[Math.min(i, steps.length - 1)][1]);
}
