"use client";

import { useEffect, useState } from "react";
import { formatIso8601DateTimeForUiDisplayBrazilLocaleShort } from "@/lib/format-iso-8601-date-time-for-ui-display-brazil-locale-short";
import { useWishTinaDialog } from "@/components/dialog/wish-tina-dialog-context-provider-client";

type HistoryRecord = {
  id: string;
  issueUrl: string;
  issueTitle: string;
  axis: string;
  score: number;
  explanation: string | null;
  createdAt: string;
};

export type WishBoardDvituHistoryPopoverProps = {
  axis: string;
  /** Nota 1–5 correspondente à alternativa da matriz. */
  score: number;
  /**
   * `true` quando a API de disponibilidade indicou que existe histórico para o par (eixo, nota).
   * Enquanto a disponibilidade ainda carrega, use `false` para não exibir o gatilho.
   */
  hasRecordsForPair: boolean;
};

/**
 * Gatilho + painel de exemplos de triagem para um par (eixo DVITU, nota). Lista só é buscada ao abrir o painel.
 * Use uma instância por alternativa (1–5) na matriz, ao lado do rótulo.
 */
export function WishBoardDvituHistoryPopover({ axis, score, hasRecordsForPair }: WishBoardDvituHistoryPopoverProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialog = useWishTinaDialog();

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    fetch(`/api/triage/history?axis=${encodeURIComponent(axis)}&score=${encodeURIComponent(String(score))}`)
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        if (json.ok) {
          setData(json.data);
        } else {
          setError(json.message);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Falha na rede");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [axis, score, open]);

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.confirm("Remover este exemplo do histórico?");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/triage/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData((prev) => prev.filter((item) => item.id !== id));
      } else {
        await dialog.alert("Falha ao remover o exemplo.");
      }
    } catch {
      await dialog.alert("Erro ao remover o exemplo.");
    }
  };

  if (!hasRecordsForPair) return null;

  return (
    <div className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="text-xs text-sky-600 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
        title="Ver issues que receberam esta nota neste eixo"
      >
        Ver exemplos
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[10001] mt-1 flex w-72 max-w-[min(18rem,85vw)] flex-col gap-3 rounded-md border border-black/10 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-zinc-900"
          role="dialog"
          aria-label={`Exemplos de nota ${score}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Exemplos de nota {score}</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              aria-label="Fechar"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-xs text-zinc-500">Carregando…</div>
          ) : error ? (
            <div className="text-xs text-red-500">Erro: {error}</div>
          ) : data.length === 0 ? (
            <div className="text-xs text-zinc-500">Nenhum exemplo encontrado para esta nota.</div>
          ) : (
            <ul className="max-h-64 space-y-3 overflow-y-auto pr-0.5">
              {data.map((item) => (
                <li key={item.id} className="text-xs border-b border-black/5 pb-2 last:border-0 last:pb-0 dark:border-white/5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="min-w-0 font-medium text-zinc-800 dark:text-zinc-200">
                      <a href={item.issueUrl} target="_blank" rel="noreferrer" className="break-words hover:underline">
                        {item.issueTitle}
                      </a>
                    </div>
                    <button
                      type="button"
                      title="Excluir do histórico"
                      onClick={() => void handleDelete(item.id)}
                      className="shrink-0 text-red-500 transition-colors hover:text-red-700"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  {item.explanation != null && item.explanation.trim() !== "" ? (
                    <div className="text-zinc-600 dark:text-zinc-400 italic">{`"${item.explanation}"`}</div>
                  ) : (
                    <div className="text-[11px] italic text-zinc-500 dark:text-zinc-500">Sem justificativa registrada</div>
                  )}
                  <div className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                    {formatIso8601DateTimeForUiDisplayBrazilLocaleShort(item.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
