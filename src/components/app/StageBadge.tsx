import { STAGE_MAP } from '@/lib/domain';
import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/lib/types';

export function StageBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const s = STAGE_MAP[status];
  if (!s) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', s.color, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}
