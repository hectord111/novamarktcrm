'use client';
import { useState } from 'react';
import { Card, Button, Input, Textarea, Label, Select } from '@/components/ui';

export interface AutomationInitial {
  id?: string;
  name?: string;
  description?: string | null;
  client_id?: string | null;
  trigger?: string;
  body?: string;
  delay_minutes?: number;
  hours?: number;
  statuses?: string[];
  is_active?: boolean;
}

const VARS = ['{{nombre}}', '{{cliente}}', '{{telefono}}'];

export function AutomationForm({
  action,
  clients,
  initial,
  submitLabel,
}: {
  action: (fd: FormData) => void | Promise<void>;
  clients: { id: string; name: string }[];
  initial?: AutomationInitial;
  submitLabel: string;
}) {
  const [trigger, setTrigger] = useState(initial?.trigger ?? 'lead_created');
  const statuses = initial?.statuses ?? ['new', 'contacted'];

  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        {initial?.id && <input type="hidden" name="id" value={initial.id} />}

        <div>
          <Label htmlFor="name">Nombre de la automatización *</Label>
          <Input id="name" name="name" required defaultValue={initial?.name} placeholder="Ej. Bienvenida WhatsApp a leads nuevos" />
        </div>

        <div>
          <Label htmlFor="description">Descripción</Label>
          <Input id="description" name="description" defaultValue={initial?.description ?? ''} placeholder="¿Qué hace esta automatización?" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="client_id">Aplicar a</Label>
            <Select id="client_id" name="client_id" defaultValue={initial?.client_id ?? ''}>
              <option value="">Todos los clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="trigger">Cuándo se ejecuta</Label>
            <Select id="trigger" name="trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
              <option value="lead_created">Cuando entra un lead nuevo</option>
              <option value="no_response">Cuando un lead no responde</option>
            </Select>
          </div>
        </div>

        {trigger === 'no_response' ? (
          <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="hours">Horas sin respuesta</Label>
              <Input id="hours" name="hours" type="number" min="1" defaultValue={initial?.hours ?? 24} />
            </div>
            <div>
              <Label>Si sigue en estado…</Label>
              <div className="flex flex-wrap gap-3 pt-1.5">
                {[
                  ['new', 'Nuevo'],
                  ['contacted', 'Contactado'],
                  ['qualified', 'Cualificado'],
                ].map(([val, label]) => (
                  <label key={val} className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <input type="checkbox" name="statuses" value={val} defaultChecked={statuses.includes(val)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="delay_minutes">Retraso antes de enviar (minutos)</Label>
            <Input id="delay_minutes" name="delay_minutes" type="number" min="0" defaultValue={initial?.delay_minutes ?? 2} className="sm:w-48" />
          </div>
        )}

        <div>
          <Label htmlFor="body">Mensaje de WhatsApp</Label>
          <Textarea id="body" name="body" rows={5} defaultValue={initial?.body} placeholder="Escribe el mensaje que recibirá el lead…" />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400">Variables:</span>
            {VARS.map((v) => (
              <code key={v} className="rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700">
                {v}
              </code>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          Activar esta automatización
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button href="/automations" variant="ghost">
            Cancelar
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
}
