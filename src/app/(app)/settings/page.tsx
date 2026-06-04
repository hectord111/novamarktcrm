import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { MessageCircle, Plug, Users, CheckCircle2, XCircle, Webhook } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { getWhatsappConfig } from '@/lib/data/settings';
import { listUsers } from '@/lib/data/users';
import { listClientOptions } from '@/lib/data/clients';
import { adminConfigured } from '@/lib/supabase/admin';
import { metaConfigured } from '@/lib/meta';
import { dbConfigured } from '@/lib/db';
import { isAgency, type UserRole } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/domain';
import { Card, CardHeader, PageHeader, Button, Input, Label, Select, Badge, Avatar } from '@/components/ui';
import { updateWhatsappConfigAction, inviteUserAction, updateUserAction } from './actions';

export const dynamic = 'force-dynamic';

function StatusRow({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-xs text-slate-400">{hint}</div>
      </div>
      {ok ? (
        <Badge tone="green"><CheckCircle2 size={12} /> Conectado</Badge>
      ) : (
        <Badge tone="slate"><XCircle size={12} /> Sin configurar</Badge>
      )}
    </div>
  );
}

export default async function SettingsPage() {
  const actor = await requireActor();
  if (!isAgency(actor)) redirect('/dashboard');

  const [wa, users, clients] = await Promise.all([getWhatsappConfig(), listUsers(actor), listClientOptions(actor)]);
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') || 'https'}://${h.get('host')}`;
  const waTokenSet = Boolean(process.env.WHATSAPP_ACCESS_TOKEN);

  return (
    <div className="animate-in max-w-4xl">
      <PageHeader title="Ajustes" subtitle="Integraciones, WhatsApp y equipo" />

      <div className="space-y-4">
        {/* WhatsApp */}
        <Card>
          <CardHeader title={<span className="inline-flex items-center gap-2"><MessageCircle size={16} className="text-emerald-600" /> WhatsApp</span>} subtitle="Canal de los mensajes automáticos a leads" />
          <form action={updateWhatsappConfigAction} className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="mode">Modo de envío</Label>
                <Select id="mode" name="mode" defaultValue={wa.mode}>
                  <option value="simulation">Simulación (no envía de verdad)</option>
                  <option value="live">En vivo (WhatsApp Cloud API)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone_number_id">Phone Number ID</Label>
                <Input id="phone_number_id" name="phone_number_id" defaultValue={wa.phone_number_id ?? ''} placeholder="Ej. 1029384756" />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {waTokenSet ? <CheckCircle2 size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-slate-400" />}
              <span>
                Token <code className="rounded bg-white px-1">WHATSAPP_ACCESS_TOKEN</code> {waTokenSet ? 'detectado' : 'no configurado'}. En modo “En vivo” necesitas el token + Phone Number ID.
              </span>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader title={<span className="inline-flex items-center gap-2"><Plug size={16} className="text-brand-600" /> Integraciones</span>} />
          <div className="divide-y divide-slate-50">
            <StatusRow ok={dbConfigured()} label="Base de datos (Supabase)" hint="Esquema nova · datos del CRM" />
            <StatusRow ok={metaConfigured()} label="Meta Marketing API" hint="META_ACCESS_TOKEN · sincronizar campañas y gasto" />
            <StatusRow ok={waTokenSet} label="WhatsApp Cloud API" hint="WHATSAPP_ACCESS_TOKEN · envío real de mensajes" />
            <StatusRow ok={adminConfigured()} label="Invitaciones de usuarios" hint="SUPABASE_SERVICE_ROLE_KEY · invitar equipo y clientes" />
          </div>
          <div className="border-t border-slate-100 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Webhook size={15} /> Endpoints para recibir leads
            </div>
            <div className="space-y-2 text-xs">
              <EndpointRow label="Webhook de Meta Lead Ads" url={`${origin}/api/webhooks/meta`} />
              <EndpointRow label="Entrada genérica de leads (forms / Zapier)" url={`${origin}/api/leads/intake`} />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Protege la entrada genérica con <code className="rounded bg-slate-100 px-1">LEAD_INTAKE_SECRET</code> y el webhook de Meta con <code className="rounded bg-slate-100 px-1">META_VERIFY_TOKEN</code>.
            </p>
          </div>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader title={<span className="inline-flex items-center gap-2"><Users size={16} className="text-brand-600" /> Equipo y accesos</span>} subtitle="Miembros de Nova y clientes con acceso al portal" />
          <div className="divide-y divide-slate-50">
            {users.map((u) => (
              <div key={u.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={u.full_name || u.email} size={36} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">{u.full_name || u.email}</div>
                    <div className="text-xs text-slate-400">{u.email}{u.client_name ? ` · ${u.client_name}` : ''}</div>
                  </div>
                </div>
                {u.id === actor.id ? (
                  <Badge tone="brand">Tú · {ROLE_LABELS[u.role]}</Badge>
                ) : (
                  <form action={updateUserAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <Select name="role" defaultValue={u.role} className="h-9 w-32 text-xs">
                      {(['owner', 'admin', 'agent', 'client'] as UserRole[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </Select>
                    <Select name="client_id" defaultValue={u.client_id ?? ''} className="h-9 w-36 text-xs">
                      <option value="">— Cliente —</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" variant="outline" size="sm">
                      Guardar
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>

          {(actor.role === 'owner' || actor.role === 'admin') && (
            <div className="border-t border-slate-100 p-5">
              <div className="mb-3 text-sm font-medium text-slate-700">Invitar a alguien</div>
              {adminConfigured() ? (
                <form action={inviteUserAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="invite_email">Email</Label>
                    <Input id="invite_email" name="email" type="email" required placeholder="persona@email.com" />
                  </div>
                  <div>
                    <Label htmlFor="invite_role">Rol</Label>
                    <Select id="invite_role" name="role" defaultValue="agent" className="sm:w-36">
                      {(['admin', 'agent', 'client'] as UserRole[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="invite_client">Cliente</Label>
                    <Select id="invite_client" name="client_id" defaultValue="" className="sm:w-40">
                      <option value="">— Ninguno —</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button type="submit">Invitar</Button>
                </form>
              ) : (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Configura <code className="rounded bg-white px-1">SUPABASE_SERVICE_ROLE_KEY</code> para invitar usuarios por email.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function EndpointRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <code className="break-all text-slate-800">{url}</code>
    </div>
  );
}
