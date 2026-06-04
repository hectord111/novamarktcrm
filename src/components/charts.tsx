import { formatCents, formatNumber } from '@/lib/format';

export interface SeriesPoint {
  date: string;
  spendCents: number;
  leads: number;
}

/** Dual chart: spend as a filled area, leads as an overlaid line. Pure SVG. */
export function SpendLeadsChart({ data }: { data: SeriesPoint[] }) {
  const w = 800;
  const h = 240;
  const pad = 28;
  const n = data.length;
  if (n === 0) return <div className="h-[240px]" />;

  const maxSpend = Math.max(1, ...data.map((d) => d.spendCents));
  const maxLeads = Math.max(1, ...data.map((d) => d.leads));
  const x = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, n - 1);
  const ys = (v: number) => h - pad - (v / maxSpend) * (h - 2 * pad);
  const yl = (v: number) => h - pad - (v / maxLeads) * (h - 2 * pad);

  const spendPts = data.map((d, i) => `${x(i)},${ys(d.spendCents)}`).join(' ');
  const areaPts = `${x(0)},${h - pad} ${spendPts} ${x(n - 1)},${h - pad}`;
  const leadsPts = data.map((d, i) => `${x(i)},${yl(d.leads)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-[240px] w-full">
      <defs>
        <linearGradient id="spendGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={h - pad - g * (h - 2 * pad)} y2={h - pad - g * (h - 2 * pad)} stroke="#eef2f7" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
      <polygon points={areaPts} fill="url(#spendGrad)" />
      <polyline points={spendPts} fill="none" stroke="#7c3aed" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <polyline points={leadsPts} fill="none" stroke="#059669" strokeWidth={2} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function Donut({ segments, centerLabel, centerValue }: { segments: DonutSegment[]; centerLabel?: string; centerValue?: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 160 160" className="h-36 w-36 shrink-0 -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f1f5f9" strokeWidth="16" />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const dash = `${len} ${c - len}`;
          const el = (
            <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={dash} strokeDashoffset={-offset} strokeLinecap="butt" />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {(centerValue || centerLabel) && (
          <div className="mb-2">
            <div className="text-lg font-semibold text-slate-900">{centerValue}</div>
            <div className="text-xs text-slate-500">{centerLabel}</div>
          </div>
        )}
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="font-semibold text-slate-900">{formatNumber(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bar list, e.g. spend per client. */
export function BarList({ items }: { items: { label: string; value: number; display?: string; color?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{it.label}</span>
            <span className="text-slate-500">{it.display ?? formatCents(it.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: it.color || '#7c3aed' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
