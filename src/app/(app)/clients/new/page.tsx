import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { isAgency } from '@/lib/types';
import { createClientAction } from '../actions';
import { Card, PageHeader, Button, Input, Label, Select } from '@/components/ui';

export const dynamic = 'force-dynamic';

const COLORS = [
  ['#7c3aed', 'Violeta'],
  ['#2563eb', 'Azul'],
  ['#0d9488', 'Verde'],
  ['#f59e0b', 'Ámbar'],
  ['#db2777', 'Rosa'],
  ['#16a34a', 'Esmeralda'],
];

export default async function NewClientPage() {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');

  return (
    <div className="animate-in mx-auto max-w-2xl">
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Volver a clientes
      </Link>
      <PageHeader title="Nuevo cliente" subtitle="Una empresa para la que generas leads con Meta Ads" />

      <Card className="p-6">
        <form action={createClientAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" required placeholder="Ej. Clínica Dental Sonrisa" />
            </div>
            <div>
              <Label htmlFor="industry">Sector</Label>
              <Input id="industry" name="industry" placeholder="Ej. Clínica dental" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="contact_name">Persona de contacto</Label>
              <Input id="contact_name" name="contact_name" placeholder="Nombre del contacto" />
            </div>
            <div>
              <Label htmlFor="contact_phone">Teléfono</Label>
              <Input id="contact_phone" name="contact_phone" placeholder="+34 600 000 000" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input id="contact_email" name="contact_email" type="email" placeholder="contacto@empresa.com" />
            </div>
            <div>
              <Label htmlFor="monthly_fee_eur">Cuota mensual (€)</Label>
              <Input id="monthly_fee_eur" name="monthly_fee_eur" type="number" step="0.01" min="0" placeholder="0,00" />
            </div>
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <Select id="color" name="color" defaultValue="#7c3aed">
              {COLORS.map(([hex, name]) => (
                <option key={hex} value={hex}>
                  {name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button href="/clients" variant="ghost">
              Cancelar
            </Button>
            <Button type="submit">Crear cliente</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
