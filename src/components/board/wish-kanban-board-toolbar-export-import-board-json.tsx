"use client";

import { useWishTinaDialog } from "@/components/dialog/wish-tina-dialog-context-provider-client";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import {
  clearWishKanbanBoardFromLocalStorageAfterSqliteMigrationV1,
  exportWishKanbanBoardJsonFile,
  importWishKanbanBoardFromJsonFile,
} from "@/lib/wish-board-localstorage-serialization";
import { clientFetchWishKanbanBoardPersistedV1Get } from "@/lib/client-fetch-wish-kanban-board-persisted-v1-api";
import { clientFetchWishKanbanBoardPersistedV1Put } from "@/lib/client-fetch-wish-kanban-board-persisted-v1-api";
import {
  wishViewOnlyBoardImportApiKeyClearFromSessionStorageV1,
  wishViewOnlyBoardImportApiKeyReadFromSessionStorageV1,
  wishViewOnlyBoardImportApiKeyWriteToSessionStorageV1,
} from "@/lib/wish-view-only-board-import-api-key-session-storage-v1";
import { WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1 } from "@/lib/wish-view-only-board-import-unauthorized-code-constant-v1";

type WishKanbanBoardToolbarExportImportBoardJsonProps = {
  board: WishKanbanBoard;
  onImportBoard: (board: WishKanbanBoard) => void;
  /** Em view-only de servidor: exige API key no PUT de importação. */
  boardImportRequiresApiKey?: boolean;
};

export function WishKanbanBoardToolbarExportImportBoardJson(
  props: WishKanbanBoardToolbarExportImportBoardJsonProps,
) {
  const tina = useWishTinaDialog();
  const boardImportRequiresApiKey = Boolean(props.boardImportRequiresApiKey);

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
        title={
          boardImportRequiresApiKey
            ? "Importar JSON (exige chave de importação do servidor)"
            : "Importar JSON (substitui o quadro salvo no servidor)"
        }
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

              const existing = await clientFetchWishKanbanBoardPersistedV1Get();
              if (existing.ok && existing.found) {
                const confirmed = await tina.confirm(
                  "Já existe um quadro salvo no servidor. Substituir pelo JSON importado? Exporte o quadro atual antes se quiser guardar uma cópia.",
                );
                if (!confirmed) return;
              }

              let importApiKey: string | undefined;
              if (boardImportRequiresApiKey) {
                let key = wishViewOnlyBoardImportApiKeyReadFromSessionStorageV1();
                if (!key) {
                  const entered = await tina.prompt(
                    "Modo visualização: informe a chave de importação do servidor (WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY).",
                    { inputType: "password" },
                  );
                  if (entered === null) return;
                  key = entered.trim();
                  if (!key) {
                    await tina.alert("A chave de importação não pode ficar vazia.");
                    return;
                  }
                  wishViewOnlyBoardImportApiKeyWriteToSessionStorageV1(key);
                }
                importApiKey = key;
              }

              let put = await clientFetchWishKanbanBoardPersistedV1Put(next, { importApiKey });
              if (
                !put.ok &&
                boardImportRequiresApiKey &&
                put.code === WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1
              ) {
                wishViewOnlyBoardImportApiKeyClearFromSessionStorageV1();
                const entered = await tina.prompt(
                  `${put.message}\n\nInforme a chave de importação novamente.`,
                  { inputType: "password" },
                );
                if (entered === null) return;
                const retryKey = entered.trim();
                if (!retryKey) {
                  await tina.alert("A chave de importação não pode ficar vazia.");
                  return;
                }
                wishViewOnlyBoardImportApiKeyWriteToSessionStorageV1(retryKey);
                put = await clientFetchWishKanbanBoardPersistedV1Put(next, { importApiKey: retryKey });
              }

              if (!put.ok) {
                if (put.code === WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1) {
                  wishViewOnlyBoardImportApiKeyClearFromSessionStorageV1();
                }
                await tina.alert(put.message);
                return;
              }

              clearWishKanbanBoardFromLocalStorageAfterSqliteMigrationV1();
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
