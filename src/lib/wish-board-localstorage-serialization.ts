import type { WishKanbanBoard, WishKanbanPersistedPayloadV1 } from "@/lib/wish-kanban-board-domain-types";
import type { WishKanbanBoardExportBundleWithDescriptionUploadedAssetsV1 } from "@/lib/wish-kanban-board-export-bundle-with-description-uploaded-assets-v1-types";
import type { WishKanbanBoardExportBundleParsedV1 } from "@/lib/wish-kanban-board-export-bundle-with-description-uploaded-assets-v1-types";
import { clientFetchCollectMirroredDescriptionUploadedAssetsBase64FromBoardForExportV1 } from "@/lib/client-fetch-collect-mirrored-description-uploaded-assets-base64-from-board-for-export-v1";
import { wishKanbanBoardParseExportBundleJsonTextAcceptVersion1Or2WithOptionalAssetsV1 } from "@/lib/wish-kanban-board-parse-export-bundle-json-text-accept-version-1-or-2-with-optional-assets-v1";

export const WISH_BOARD_LOCAL_STORAGE_KEY_V1 = "tinadosdesejos.board.v1" as const;

export function createEmptyWishKanbanBoard(): WishKanbanBoard {
  const boardId = crypto.randomUUID();
  const colId = crypto.randomUUID();
  return {
    id: boardId,
    title: "Tina dos desejos",
    columnOrder: [colId],
    columnsById: {
      [colId]: { id: colId, title: "Backlog", cardIds: [] },
    },
    cardsById: {},
  };
}

export function parseWishKanbanPersistedPayloadV1(
  raw: string,
): WishKanbanPersistedPayloadV1 | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const version = (parsed as { version?: unknown }).version;
    if (version !== 1) return null;
    const board = (parsed as { board?: unknown }).board;
    if (!board || typeof board !== "object") return null;
    return parsed as WishKanbanPersistedPayloadV1;
  } catch {
    return null;
  }
}

export function stringifyWishKanbanBoard(board: WishKanbanBoard): string {
  const payload: WishKanbanPersistedPayloadV1 = { version: 1, board };
  return JSON.stringify(payload, null, 2);
}

export function readWishKanbanBoardFromLocalStorage(): WishKanbanBoard | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(WISH_BOARD_LOCAL_STORAGE_KEY_V1);
  if (!raw) return null;
  const payload = parseWishKanbanPersistedPayloadV1(raw);
  return payload?.board ?? null;
}

export function writeWishKanbanBoardToLocalStorage(board: WishKanbanBoard): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WISH_BOARD_LOCAL_STORAGE_KEY_V1, stringifyWishKanbanBoard(board));
}

/** Remove cópia legada do navegador após migração/import bem-sucedidos no SQLite. */
export function clearWishKanbanBoardFromLocalStorageAfterSqliteMigrationV1(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WISH_BOARD_LOCAL_STORAGE_KEY_V1);
  } catch {
    /* ignore */
  }
}

/** Export legado (só quadro, sem imagens). Preferir `exportWishKanbanBoardJsonFileWithMirroredDescriptionAssetsV1`. */
export function exportWishKanbanBoardJsonFile(board: WishKanbanBoard, filename: string): void {
  const blob = new Blob([stringifyWishKanbanBoard(board)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta `{ version: 2, board, descriptionUploadedAssetsBase64ByFileNameV1 }`
 * incluindo PNGs/etc. espelhados (necessário para o viewer na VPS sem GitLab).
 */
export async function exportWishKanbanBoardJsonFileWithMirroredDescriptionAssetsV1(
  board: WishKanbanBoard,
  filename: string,
): Promise<{ assetCount: number }> {
  const assets = await clientFetchCollectMirroredDescriptionUploadedAssetsBase64FromBoardForExportV1(board);
  const payload: WishKanbanBoardExportBundleWithDescriptionUploadedAssetsV1 = {
    version: 2,
    board,
    descriptionUploadedAssetsBase64ByFileNameV1: assets,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  return { assetCount: Object.keys(assets).length };
}

export async function importWishKanbanBoardFromJsonFile(file: File): Promise<WishKanbanBoard> {
  const bundle = await importWishKanbanBoardExportBundleFromJsonFileV1(file);
  return bundle.board;
}

export async function importWishKanbanBoardExportBundleFromJsonFileV1(
  file: File,
): Promise<WishKanbanBoardExportBundleParsedV1> {
  const text = await file.text();
  const payload = wishKanbanBoardParseExportBundleJsonTextAcceptVersion1Or2WithOptionalAssetsV1(text);
  if (!payload) {
    throw new Error(
      "Arquivo inválido: esperado JSON `{ version: 1|2, board: ... }` (v2 pode incluir imagens espelhadas).",
    );
  }
  return payload;
}
