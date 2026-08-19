"use client";

import { useState } from "react";
import { useWishTinaDialog } from "@/components/dialog/wish-tina-dialog-context-provider-client";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import {
  clearWishKanbanBoardFromLocalStorageAfterSqliteMigrationV1,
  exportWishKanbanBoardJsonFileWithMirroredDescriptionAssetsV1,
  importWishKanbanBoardExportBundleFromJsonFileV1,
} from "@/lib/wish-board-localstorage-serialization";
import { clientFetchWishKanbanBoardPersistedV1Get } from "@/lib/client-fetch-wish-kanban-board-persisted-v1-api";
import { clientFetchWishKanbanBoardPersistedV1Put } from "@/lib/client-fetch-wish-kanban-board-persisted-v1-api";
import { clientFetchWishKanbanBoardDescriptionUploadedAssetsImportV1Put } from "@/lib/client-fetch-wish-kanban-board-description-uploaded-assets-import-v1-api";
import { clientFetchWishPublishBoardToProductionViewerPreviewV1Post } from "@/lib/client-fetch-wish-publish-board-to-production-viewer-v1-api";
import { clientFetchWishPublishBoardToProductionViewerV1Post } from "@/lib/client-fetch-wish-publish-board-to-production-viewer-v1-api";
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
  /** Editor local com env de publish para a VPS. */
  productionPublishAvailable?: boolean;
};

async function resolveImportApiKeyWithOptionalRetryPrompt(params: {
  boardImportRequiresApiKey: boolean;
  prompt: (message: string, options?: { inputType?: "text" | "password" }) => Promise<string | null>;
  alert: (message: string) => Promise<void>;
  initialMessage?: string;
}): Promise<string | undefined> {
  if (!params.boardImportRequiresApiKey) return undefined;

  let key = wishViewOnlyBoardImportApiKeyReadFromSessionStorageV1();
  if (!key) {
    const entered = await params.prompt(
      params.initialMessage ??
        "Modo visualização: informe a chave de importação do servidor (WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY).",
      { inputType: "password" },
    );
    if (entered === null) return "__cancelled__";
    key = entered.trim();
    if (!key) {
      await params.alert("A chave de importação não pode ficar vazia.");
      return "__cancelled__";
    }
    wishViewOnlyBoardImportApiKeyWriteToSessionStorageV1(key);
  }
  return key;
}

export function WishKanbanBoardToolbarExportImportBoardJson(
  props: WishKanbanBoardToolbarExportImportBoardJsonProps,
) {
  const tina = useWishTinaDialog();
  const boardImportRequiresApiKey = Boolean(props.boardImportRequiresApiKey);
  const productionPublishAvailable = Boolean(props.productionPublishAvailable);
  const [exportingBoardJson, setExportingBoardJson] = useState(false);
  const [publishingToVps, setPublishingToVps] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={exportingBoardJson || publishingToVps}
        aria-busy={exportingBoardJson}
        className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        onClick={() => {
          if (exportingBoardJson || publishingToVps) return;
          void (async () => {
            setExportingBoardJson(true);
            try {
              const { assetCount } = await exportWishKanbanBoardJsonFileWithMirroredDescriptionAssetsV1(
                props.board,
                "tinadosdesejos-board.json",
              );
              if (assetCount === 0) {
                await tina.alert(
                  "JSON exportado. Nenhuma imagem espelhada foi incluída (cards sem descrição com /uploads/ espelhado, ou assets ausentes no disco local).",
                );
              } else {
                await tina.alert(
                  `JSON exportado com ${assetCount} imagem(ns) espelhada(s).`,
                );
              }
            } catch (cause) {
              const message = cause instanceof Error ? cause.message : "Falha ao exportar.";
              await tina.alert(message);
            } finally {
              setExportingBoardJson(false);
            }
          })();
        }}
        title="Exportar JSON (quadro + imagens espelhadas da descrição)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        <span className="hidden sm:inline">{exportingBoardJson ? "Exportando…" : "Exportar"}</span>
      </button>

      {productionPublishAvailable ? (
        <button
          type="button"
          disabled={publishingToVps || exportingBoardJson}
          aria-busy={publishingToVps}
          className="inline-flex items-center gap-2 rounded-md border border-emerald-600/40 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-50 dark:hover:bg-emerald-900/50"
          title="Compara com a VPS, mostra o diff e publica (só envia imagens que faltam lá)"
          onClick={() => {
            if (publishingToVps || exportingBoardJson) return;
            void (async () => {
              setPublishingToVps(true);
              try {
                const preview = await clientFetchWishPublishBoardToProductionViewerPreviewV1Post({
                  board: props.board,
                });
                if (!preview.ok) {
                  await tina.alert(preview.message);
                  return;
                }
                const confirmed = await tina.confirm(preview.confirmMessagePtBr);
                if (!confirmed) return;

                const result = await clientFetchWishPublishBoardToProductionViewerV1Post({
                  board: props.board,
                });
                if (!result.ok) {
                  await tina.alert(result.message);
                  return;
                }
                const skippedRemote =
                  typeof result.assetSkippedAlreadyOnRemoteCount === "number" &&
                  result.assetSkippedAlreadyOnRemoteCount > 0
                    ? ` ${result.assetSkippedAlreadyOnRemoteCount} já estavam na VPS.`
                    : "";
                const missing =
                  result.missingLocalAssetCount > 0
                    ? ` ${result.missingLocalAssetCount} imagem(ns) referenciada(s) não estavam no disco local.`
                    : "";
                await tina.alert(
                  `Publicado em ${result.productionBaseUrl}. Imagens enviadas: ${result.assetWrittenCount}.${skippedRemote}${missing}`,
                );
              } catch (cause) {
                const message = cause instanceof Error ? cause.message : "Falha ao publicar.";
                await tina.alert(message);
              } finally {
                setPublishingToVps(false);
              }
            })();
          }}
        >
          <span className="hidden sm:inline">{publishingToVps ? "Publicando…" : "Publicar na VPS"}</span>
          <span className="sm:hidden">{publishingToVps ? "…" : "VPS"}</span>
        </button>
      ) : null}

      <label
        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        title={
          boardImportRequiresApiKey
            ? "Importar JSON (quadro + imagens; exige chave de importação)"
            : "Importar JSON (quadro + imagens espelhadas)"
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
              const bundle = await importWishKanbanBoardExportBundleFromJsonFileV1(file);
              const next = bundle.board;
              const assets = bundle.descriptionUploadedAssetsBase64ByFileNameV1;
              const assetCount = Object.keys(assets).length;

              const existing = await clientFetchWishKanbanBoardPersistedV1Get();
              if (existing.ok && existing.found) {
                const confirmed = await tina.confirm(
                  "Já existe um quadro salvo no servidor. Substituir pelo JSON importado? Exporte o quadro atual antes se quiser guardar uma cópia.",
                );
                if (!confirmed) return;
              }

              let importApiKey = await resolveImportApiKeyWithOptionalRetryPrompt({
                boardImportRequiresApiKey,
                prompt: tina.prompt,
                alert: tina.alert,
              });
              if (importApiKey === "__cancelled__") return;

              if (assetCount > 0) {
                let assetsPut = await clientFetchWishKanbanBoardDescriptionUploadedAssetsImportV1Put(assets, {
                  importApiKey,
                });
                if (
                  !assetsPut.ok &&
                  boardImportRequiresApiKey &&
                  assetsPut.code === WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1
                ) {
                  wishViewOnlyBoardImportApiKeyClearFromSessionStorageV1();
                  importApiKey = await resolveImportApiKeyWithOptionalRetryPrompt({
                    boardImportRequiresApiKey,
                    prompt: tina.prompt,
                    alert: tina.alert,
                    initialMessage: `${assetsPut.message}\n\nInforme a chave de importação novamente.`,
                  });
                  if (importApiKey === "__cancelled__") return;
                  assetsPut = await clientFetchWishKanbanBoardDescriptionUploadedAssetsImportV1Put(assets, {
                    importApiKey,
                  });
                }
                if (!assetsPut.ok) {
                  if (assetsPut.code === WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1) {
                    wishViewOnlyBoardImportApiKeyClearFromSessionStorageV1();
                  }
                  await tina.alert(assetsPut.message);
                  return;
                }
              }

              let put = await clientFetchWishKanbanBoardPersistedV1Put(next, { importApiKey });
              if (
                !put.ok &&
                boardImportRequiresApiKey &&
                put.code === WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1
              ) {
                wishViewOnlyBoardImportApiKeyClearFromSessionStorageV1();
                importApiKey = await resolveImportApiKeyWithOptionalRetryPrompt({
                  boardImportRequiresApiKey,
                  prompt: tina.prompt,
                  alert: tina.alert,
                  initialMessage: `${put.message}\n\nInforme a chave de importação novamente.`,
                });
                if (importApiKey === "__cancelled__") return;
                put = await clientFetchWishKanbanBoardPersistedV1Put(next, { importApiKey });
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

              if (assetCount === 0) {
                await tina.alert(
                  "Quadro importado. Este JSON não trouxe imagens espelhadas (versão 1 ou export sem assets). Na VPS as figuras da descrição podem ficar quebradas — exporte de novo no editor local (versão 2 inclui as imagens).",
                );
              }
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
