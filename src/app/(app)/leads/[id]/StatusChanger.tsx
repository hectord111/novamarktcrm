'use client';
import { useState } from 'react';
import { updateLeadStatusAction } from '../actions';
import { LEAD_STAGES } from '@/lib/domain';
import { Button, Label, Input, Select } from '@/components/ui';
import type { LeadStatus } from '@/lib/types';

export function StatusChanger({ id, current }: { id: string; current: LeadStatus }) {
  const [status, setStatus] = useState<LeadStatus>(current);
  return (
    <form action={updateLeadStatusAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <Label htmlFor="status">Estado del lead</Label>
        <Select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
          {LEAD_STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      {status === 'converted' && (
        <div>
          <Label htmlFor="value_eur">Valor del cierre (€)</Label>
          <Input id="value_eur" name="value_eur" type="number" step="0.01" min="0" placeholder="0,00" />
        </div>
      )}
      {status === 'lost' && (
        <div>
          <Label htmlFor="lost_reason">Motivo de la pérdida</Label>
          <Input id="lost_reason" name="lost_reason" placeholder="Ej. Sin presupuesto" />
        </div>
      )}
      <Button type="submit" className="w-full">
        Actualizar estado
      </Button>
    </form>
  );
}
