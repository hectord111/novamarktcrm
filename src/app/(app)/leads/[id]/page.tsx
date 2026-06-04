import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Mail, Phone, MessageCircle, StickyNote, ArrowRightLeft, UserPlus, UserCheck, Megaphone, Calendar, Tag, CheckCircle2,
} from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { getLead } from '@/lib/data/leads';
import { Card, CardHeader, Avatar, Badge, Button, Textarea } from '@/components/ui';
import { StageBadge } from '@/components/app/StageBadge';
import { StatusChanger } from './StatusChanger';
import { addNoteAction } from '../actions';
import { isAgency, type LeadStatus } from '@/lib/types';
import { sourceLabel } from '@/lib/domain';
import { formatCents, formatDate, timeAgo } from '@/lib/format';

export const dynamic = 'force-dynamic';

const ACTIVITY_ICON: Record<string, typeof Mail> = {
  created: UserPlus,
  note: StickyNote,
  status_change: ArrowRightLeft,
  message: MessageCircle,
  assigned: UserCheck,
  call: Phone,
  email: Mail,
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const data = await getLead(actor, id);
  if (!data) notFound();
  const { lead, activities, messages } = data;

  type FeedItem = { ts: string; kind: 'activity' | 'message'; type: string; content: string; status?: string };
  const feed: FeedItem[] = [
    ...activities.map((a) => ({ ts: a.created_at, kind: 'activity' as const, type: a.type, content: a.content || '' })),
    ...messages.map((m) => ({
      ts: m.created_at,
      kind: 'message' as const,
      type: 'message',
      content: m.body || '',
      status: m.status,
    })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  const waLink = lead.phone ? `https://wa.me/${lead.phone.replace(/[^\d]/g, '')}` : null;

  return (
    <div className="animate-in">
      <Link href="/leads" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Volver a leads
      </Link>

      {/* Header */}
      <Card className="mb-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={lead.full_name || '?'} color={lead.client_color} size={52} />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{lead.full_name || 'Lead sin nombre'}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {isAgency(actor) && (
                  <Link href={`/clients/${lead.client_id}`} className="inline-flex items-center gap-1.5 hover:text-slate-800">
                    <span className="h-2 w-2 rounded-full" style={{ background: lead.client_color || '#7c3aed' }} />
                    {lead.client_name}
                  </Link>
                )}
                <Badge tone="slate">{sourceLabel(lead.source)}</Badge>
                <span className="inline-flex items-center gap-1"><Calendar size={13} /> {timeAgo(lead.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StageBadge status={lead.status} className="px-3 py-1 text-sm" />
            {waLink && (
              <Button href={waLink} variant="outline" size="sm">
                <MessageCircle size={15} /> WhatsApp
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Activity column */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Actividad" subtitle="Notas, cambios de estado y mensajes" />
            <div className="p-5">
              <form action={addNoteAction} className="mb-5">
                <input type="hidden" name="id" value={lead.id} />
                <Textarea name="content" placeholder="Añade una nota sobre este lead…" />
                <div className="mt-2 flex justify-end">
                  <Button type="submit" size="sm">
                    Añadir nota
                  </Button>
                </div>
              </form>

              <ol className="relative space-y-4 border-l border-slate-100 pl-6">
                {feed.map((item, i) => {
                  const Icon = item.kind === 'message' ? MessageCircle : ACTIVITY_ICON[item.type] || Tag;
                  return (
                    <li key={i} className="relative">
                      <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                        <Icon size={13} className="text-slate-500" />
                      </span>
                      {item.kind === 'message' ? (
                        <div className="rounded-lg rounded-tl-none bg-emerald-50 px-3 py-2">
                          <div className="mb-0.5 flex items-center gap-2 text-xs font-medium text-emerald-700">
                            WhatsApp
                            <Badge tone={item.status === 'failed' ? 'red' : 'green'}>{item.status}</Badge>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-slate-700">{item.content}</p>
                          <time className="mt-1 block text-[11px] text-slate-400">{formatDate(item.ts, true)}</time>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-slate-700">{item.content}</p>
                          <time className="text-[11px] text-slate-400">{formatDate(item.ts, true)}</time>
                        </div>
                      )}
                    </li>
                  );
                })}
                {!feed.length && <li className="text-sm text-slate-400">Sin actividad todavía.</li>}
              </ol>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <StatusChanger id={lead.id} current={lead.status as LeadStatus} />
          </Card>

          <Card>
            <CardHeader title="Detalles" />
            <dl className="divide-y divide-slate-50 text-sm">
              <Detail icon={<Mail size={14} />} label="Email" value={lead.email ? <a className="text-brand-700 hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a> : '—'} />
              <Detail icon={<Phone size={14} />} label="Teléfono" value={lead.phone ? <a className="text-brand-700 hover:underline" href={`tel:${lead.phone}`}>{lead.phone}</a> : '—'} />
              <Detail icon={<Megaphone size={14} />} label="Campaña" value={lead.campaign_name || '—'} />
              <Detail icon={<Tag size={14} />} label="Origen" value={sourceLabel(lead.source)} />
              {lead.status === 'converted' && (
                <Detail icon={<CheckCircle2 size={14} />} label="Valor cierre" value={<span className="font-semibold text-emerald-600">{formatCents(lead.value_cents)}</span>} />
              )}
              <Detail icon={<Calendar size={14} />} label="Creado" value={formatDate(lead.created_at, true)} />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <dt className="inline-flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="text-right text-slate-800">{value}</dd>
    </div>
  );
}
