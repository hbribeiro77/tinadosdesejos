import type { WishKanbanBoard, WishKanbanPersistedPayloadV1 } from "@/lib/wish-kanban-board-domain-types";

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

export async function importWishKanbanBoardFromJsonFile(file: File): Promise<WishKanbanBoard> {
  const text = await file.text();
  const payload = parseWishKanbanPersistedPayloadV1(text);
  if (!payload) {
    throw new Error("Arquivo inválido: esperado JSON `{ version: 1, board: ... }`.");
  }
  return payload.board;
}
