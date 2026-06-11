'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe, Download } from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui';
import { searchPlacesAction, importProspectsAction } from '@/app/(app)/prospecting/actions';
import type { PlaceResult } from '@/lib/places';

export function ProspectSearch({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [que, setQue] = useState('');
  const [donde, setDonde] = useState('');
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!configured) {
    return (
      <div className="rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Búsqueda automática desactivada.</strong> Añade <code className="rounded bg-amber-100 px-1 font-mono text-xs">GOOGLE_PLACES_API_KEY</code> en
        Vercel para buscar negocios sin web por sector y ciudad (Google Cloud → «Places API (New)» → crear clave). Mientras tanto puedes añadir prospectos a mano más abajo.
      </div>
    );
  }

  function search() {
    if (!que.trim() || !donde.trim()) return;
    setNote(null);
    startTransition(async () => {
      const res = await searchPlacesAction(que, donde);
      if (res.error) {
        setNote(`⚠️ ${res.error}`);
        setResults(null);
        return;
      }
      setResults(res.results);
      // Preselect exactly the businesses without a website — the target list.
      setSelected(new Set(res.results.filter((r) => !r.website).map((r) => r.place_id)));
    });
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function importSelected() {
    const items = (results ?? []).filter((r) => selected.has(r.place_id));
    if (!items.length) return;
    startTransition(async () => {
      const n = await importProspectsAction(items, que.trim(), donde.trim());
      setNote(`✅ ${n} ${n === 1 ? 'prospecto importado' : 'prospectos importados'} con su landing de muestra lista.`);
      setResults(null);
      setSelected(new Set());
      router.refresh();
    });
  }

  const sinWeb = (results ?? []).filter((r) => !r.website).length;

  return (
    <div className="rounded-lg border-2 border-ink bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={que} onChange={(e) => setQue(e.target.value)} placeholder="¿Qué? — ej. peluquerías, fontaneros…" onKeyDown={(e) => e.key === 'Enter' && search()} />
        <Input value={donde} onChange={(e) => setDonde(e.target.value)} placeholder="¿Dónde? — ej. Alicante" className="sm:w-56" onKeyDown={(e) => e.key === 'Enter' && search()} />
        <Button onClick={search} disabled={pending || !que.trim() || !donde.trim()}>
          <Search size={15} /> {pending ? 'Buscando…' : 'Buscar'}
        </Button>
      </div>

      {note && <p className="mt-3 text-sm font-semibold text-ink/70">{note}</p>}

      {results && (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink/60">
              {results.length} resultados · <strong className="text-ink">{sinWeb} sin web</strong> (preseleccionados)
            </p>
            <Button size="sm" variant="accent" onClick={importSelected} disabled={pending || selected.size === 0}>
              <Download size={14} /> Importar {selected.size} seleccionados
            </Button>
          </div>
          <div className="overflow-x-auto rounded-md border-2 border-ink/10">
            <table className="w-full text-sm">
              <tbody>
                {results.map((r) => (
                  <tr key={r.place_id} className="border-b border-ink/5 last:border-0 hover:bg-paper">
                    <td className="w-10 px-3 py-2.5">
                      <input type="checkbox" checked={selected.has(r.place_id)} onChange={() => toggle(r.place_id)} className="h-4 w-4 accent-[#0b0b0b]" />
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="font-semibold text-ink">{r.name}</div>
                      <div className="text-xs text-ink/40">{r.address}</div>
                    </td>
                    <td className="px-2 py-2.5 text-xs text-ink/60">{r.phone ?? <span className="text-ink/30">sin teléfono</span>}</td>
                    <td className="px-2 py-2.5 text-xs text-ink/60">
                      {r.rating != null ? `★ ${Number(r.rating).toLocaleString('es-ES', { minimumFractionDigits: 1 })}${r.reviews_count ? ` (${r.reviews_count})` : ''}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {r.website ? (
                        <Badge tone="slate"><Globe size={11} /> Con web</Badge>
                      ) : (
                        <Badge tone="brand">Sin web 🎯</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
