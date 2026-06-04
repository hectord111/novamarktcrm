import { MessageCircle, Info } from 'lucide-react';
import { requireActor } from '@/lib/auth';
import { listRecentMessages, getMessageStats } from '@/lib/data/messages';
import { getWhatsappConfig } from '@/lib/data/settings';
import { Card, PageHeader, Badge, StatCard, EmptyState } from '@/components/ui';
import { formatNumber, formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const STATUS_TONE: Record<string, 'green' | 'amber' | 'red' | 'slate' | 'sky'> = {
  sent: 'green',
  delivered: 'green',
  read: 'green',
  simulated: 'sky',
  queued: 'amber',
  failed: 'red',
};

export default async function MessagesPage() {
  const actor = await requireActor();
  const [messages, stats, wa] = await Promise.all([listRecentMessages(actor), getMessageStats(actor), getWhatsappConfig()]);

  return (
    <div className="animate-in">
      <PageHeader title="Mensajes" subtitle="Historial de WhatsApp enviados a tus leads" />

      {wa.mode === 'simulation' && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-sky-900">
          <Info size={18} className="mt-0.5 shrink-0 text-sky-600" />
          <p>
            WhatsApp está en <strong>modo simulación</strong>: los mensajes se registran aquí pero no se envían de verdad. Configura{' '}
            <code className="rounded bg-white px-1">WHATSAPP_ACCESS_TOKEN</code> y cambia el modo a “En vivo” en Ajustes para enviarlos.
          </p>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Mensajes (30d)" value={formatNumber(stats.total)} />
        <StatCard label="Entregados / simulados" value={formatNumber(stats.delivered)} />
        <StatCard label="Modo" value={wa.mode === 'live' ? 'En vivo' : 'Simulación'} />
      </div>

      {messages.length === 0 ? (
        <EmptyState icon={<MessageCircle size={28} />} title="Sin mensajes todavía" description="Los mensajes automáticos aparecerán aquí en cuanto entren leads." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Lead</th>
                  <th className="px-3 py-3 font-medium">Mensaje</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0 align-top hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{m.lead_name || m.to_address || '—'}</div>
                      <div className="text-xs text-slate-400">{m.client_name}</div>
                    </td>
                    <td className="max-w-md px-3 py-3 text-slate-600">
                      <p className="line-clamp-2">{m.body}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={STATUS_TONE[m.status] ?? 'slate'}>{m.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-slate-400">{formatDate(m.created_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
