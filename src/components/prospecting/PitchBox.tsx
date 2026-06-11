'use client';
import { useState, useTransition } from 'react';
import { Copy, MessageCircle, Send } from 'lucide-react';
import { Button, Textarea } from '@/components/ui';
import { sendPitchAction, markContactedAction } from '@/app/(app)/prospecting/actions';
import { waPhone } from '@/lib/landing';

export function PitchBox({ id, phone, initialPitch }: { id: string; phone: string | null; initialPitch: string }) {
  const [pitch, setPitch] = useState(initialPitch);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const wa = waPhone(phone);

  function copy() {
    navigator.clipboard.writeText(pitch).then(() => setNote('Mensaje copiado ✅'));
  }

  function openWhatsapp() {
    // Manual send from your own WhatsApp — the safest way to do cold outreach.
    startTransition(async () => {
      await markContactedAction(id);
    });
    setNote('Abierto en WhatsApp · marcado como contactado');
  }

  function sendAuto() {
    startTransition(async () => {
      const res = await sendPitchAction(id, pitch);
      if (!res.ok) setNote(`⚠️ ${res.error}`);
      else setNote(res.simulated ? '📨 Enviado en modo simulación (actívalo en Ajustes → WhatsApp)' : '📨 Enviado por WhatsApp Cloud ✅');
    });
  }

  return (
    <div>
      <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={7} className="text-[13px] leading-relaxed" />
      <div className="mt-2.5 flex flex-wrap gap-2">
        {wa ? (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(pitch)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={openWhatsapp}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#25D366] px-3.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
          >
            <MessageCircle size={14} /> Abrir WhatsApp
          </a>
        ) : (
          <span className="text-xs font-semibold text-rose-600">Sin teléfono: añade uno para poder contactar.</span>
        )}
        <Button size="sm" variant="outline" onClick={copy} type="button">
          <Copy size={13} /> Copiar
        </Button>
        {wa && (
          <Button size="sm" variant="secondary" onClick={sendAuto} disabled={pending} type="button" title="Envía mediante la integración de WhatsApp del CRM">
            <Send size={13} /> {pending ? 'Enviando…' : 'Envío automático'}
          </Button>
        )}
      </div>
      {note && <p className="mt-2 text-xs font-semibold text-ink/60">{note}</p>}
      <p className="mt-2 text-[11px] leading-relaxed text-ink/40">
        Consejo: el envío manual (botón verde) desde tu número es más personal y evita bloqueos de WhatsApp por mensajes masivos.
      </p>
    </div>
  );
}
