"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import { wishKanbanBoardBuildSearchResultRowDtosFromBoardAndMatchingCardIdsV1 } from "@/lib/wish-kanban-board-build-search-result-row-dtos-from-board-and-matching-card-ids-v1";

export type WishKanbanBoardModalSearchResultsMatchingIssuesListClientProps = {
  open: boolean;
  searchQuery: string;
  board: WishKanbanBoard;
  matchingCardIds: ReadonlySet<string>;
  onClose: () => void;
  onSelectCard: (cardId: string, columnId: string) => void;
};

export function WishKanbanBoardModalSearchResultsMatchingIssuesListClient(
  props: WishKanbanBoardModalSearchResultsMatchingIssuesListClientProps,
) {
  const rows = useMemo(
    () =>
      wishKanbanBoardBuildSearchResultRowDtosFromBoardAndMatchingCardIdsV1(
        props.board,
        props.matchingCardIds,
      ),
    [props.board, props.matchingCardIds],
  );

  const trimmedQuery = props.searchQuery.trim();

  const handleClose = useCallback(() => {
    props.onClose();
  }, [props]);

  useEffect(() => {
    if (!props.open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props.open, handleClose]);

  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wish-kanban-board-search-results-modal-title"
        className="flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-black/10 bg-white text-zinc-900 shadow-lg dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/5 p-5 dark:border-white/10">
          <div className="min-w-0">
            <div id="wish-kanban-board-search-results-modal-title" className="text-sm font-semibold">
              Resultados da busca
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {trimmedQuery ? (
                <>
                  Filtro: <span className="font-medium text-violet-800 dark:text-violet-200">“{trimmedQuery}”</span>
                </>
              ) : (
                "Filtro ativo"
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {rows.length === 0
                ? "Nenhuma issue corresponde ao filtro."
                : `${rows.length} issue${rows.length === 1 ? "" : "s"} — clique para ir ao card no quadro.`}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            onClick={handleClose}
          >
            Fechar
          </button>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Issues encontradas pela busca">
          {rows.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Tente outro termo ou limpe a busca para ver todo o quadro.
            </li>
          ) : (
            rows.map((row) => (
              <li key={row.cardId}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-violet-50/90 dark:hover:bg-violet-950/35"
                  onClick={() => {
                    props.onSelectCard(row.cardId, row.columnId);
                  }}
                >
                  <span className="mt-0.5 shrink-0 rounded-md border border-violet-300/60 bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-900 dark:border-violet-600/50 dark:bg-violet-950/50 dark:text-violet-100">
                    {row.iid != null ? `#${row.iid}` : "—"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {row.title}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="truncate">Coluna: {row.columnTitle}</span>
                      {row.state ? (
                        <span className="rounded-full bg-zinc-100 px-1.5 py-px font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {row.state}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {row.webUrl ? (
                    <a
                      href={row.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md p-1.5 text-zinc-400 hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                      title="Abrir issue no GitLab"
                      aria-label="Abrir issue no GitLab em nova aba"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
