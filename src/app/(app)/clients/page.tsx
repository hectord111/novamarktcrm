import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Users, Megaphone, Trophy } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listClients } from '@/lib/data/clients';
import { isAgency } from '@/lib/types';
import { Card, PageHeader, Button, Avatar, Badge, EmptyState } from '@/components/ui';
import { formatCents, formatNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

const STATUS_TONE = { active: 'green', paused: 'amber', archived: 'slate' } as const;
const STATUS_LABEL = { active: 'Activo', paused: 'En pausa', archived: 'Archivado' } as const;

export default async function ClientsPage() {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');
  const clients = await listClients(actor);

  return (
    <div className="animate-in">
      <PageHeader title="Clientes" subtitle="Las empresas para las que generas leads con Meta Ads">
        <Button href="/clients/new">
          <Plus size={16} /> Nuevo cliente
        </Button>
      </PageHeader>

      {clients.length === 0 ? (
        <EmptyState
          title="Aún no tienes clientes"
          description="Crea tu primer cliente para empezar a registrar campañas y leads."
          action={<Button href="/clients/new"><Plus size={16} /> Nuevo cliente</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}`}>
              <Card className="p-5 transition hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} color={c.color} size={44} />
                    <div>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.industry || 'Sin sector'}</div>
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                  <Metric icon={<Users size={14} />} label="Leads" value={formatNumber(c.leads)} />
                  <Metric icon={<Trophy size={14} />} label="Cerrados" value={formatNumber(c.converted)} />
                  <Metric icon={<Megaphone size={14} />} label="Campañas" value={formatNumber(c.active_campaigns)} />
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <span className="text-slate-500">Inversión 30 días</span>
                  <span className="font-semibold text-slate-900">{formatCents(c.spend30_cents, true)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-slate-400">{icon}</div>
      <div className="mt-1 text-base font-semibold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  );
}
