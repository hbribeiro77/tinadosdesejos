"use client";

import { useWishTinaDialog } from "@/components/dialog/wish-tina-dialog-context-provider-client";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import {
  exportWishKanbanBoardJsonFile,
  importWishKanbanBoardFromJsonFile,
} from "@/lib/wish-board-localstorage-serialization";

type WishKanbanBoardToolbarExportImportBoardJsonProps = {
  board: WishKanbanBoard;
  onImportBoard: (board: WishKanbanBoard) => void;
};

export function WishKanbanBoardToolbarExportImportBoardJson(
  props: WishKanbanBoardToolbarExportImportBoardJsonProps,
) {
  const tina = useWishTinaDialog();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        onClick={() => exportWishKanbanBoardJsonFile(props.board, "tinadosdesejos-board.json")}
        title="Exportar JSON"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        <span className="hidden sm:inline">Exportar</span>
      </button>

      <label
        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        title="Importar JSON"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        <span className="hidden sm:inline">Importar</span>
        <input
          className="hidden"
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              const next = await importWishKanbanBoardFromJsonFile(file);
              props.onImportBoard(next);
            } catch (cause) {
              const message = cause instanceof Error ? cause.message : "Falha ao importar.";
              void tina.alert(message);
            }
          }}
        />
      </label>
    </div>
  );
}
