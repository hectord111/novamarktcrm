import { ThumbsUp, MessageSquare, Share2, ImageIcon, Globe } from 'lucide-react';

export const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: 'Más información',
  WHATSAPP_MESSAGE: 'Enviar WhatsApp',
  MESSAGE_PAGE: 'Enviar mensaje',
  SIGN_UP: 'Registrarte',
  BOOK_TRAVEL: 'Reservar',
  SHOP_NOW: 'Comprar',
  CALL_NOW: 'Llamar ahora',
  GET_QUOTE: 'Solicitar presupuesto',
  CONTACT_US: 'Contáctanos',
};

export function AdPreview({
  pageName,
  primaryText,
  headline,
  description,
  imageUrl,
  ctaType,
  linkLabel,
}: {
  pageName: string;
  primaryText?: string | null;
  headline?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  ctaType?: string | null;
  linkLabel?: string | null;
}) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 p-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {pageName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{pageName}</div>
          <div className="text-[11px] text-slate-400">Publicidad · <Globe size={10} className="inline" /></div>
        </div>
      </div>

      <p className="whitespace-pre-wrap px-3 pb-2 text-sm text-slate-800">
        {primaryText || 'Aquí aparecerá el texto principal de tu anuncio…'}
      </p>

      <div className="relative aspect-[1.91/1] w-full bg-slate-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-300">
            <ImageIcon size={32} />
            <span className="mt-1 text-xs">Imagen del anuncio</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">{linkLabel || 'tu-web.com'}</div>
          <div className="truncate text-sm font-semibold text-slate-900">{headline || 'Titular del anuncio'}</div>
          {description && <div className="truncate text-xs text-slate-500">{description}</div>}
        </div>
        <button className="shrink-0 rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
          {CTA_LABELS[ctaType || 'LEARN_MORE'] || 'Más información'}
        </button>
      </div>

      <div className="flex items-center justify-around border-t border-slate-100 py-1.5 text-slate-400">
        <span className="flex items-center gap-1.5 text-xs"><ThumbsUp size={14} /> Me gusta</span>
        <span className="flex items-center gap-1.5 text-xs"><MessageSquare size={14} /> Comentar</span>
        <span className="flex items-center gap-1.5 text-xs"><Share2 size={14} /> Compartir</span>
      </div>
    </div>
  );
}
