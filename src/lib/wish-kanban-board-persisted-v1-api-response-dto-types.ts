import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";

export type WishKanbanBoardPersistedV1GetOkFoundDto = {
  ok: true;
  found: true;
  board: WishKanbanBoard;
  updatedAt: string;
};

export type WishKanbanBoardPersistedV1GetOkEmptyDto = {
  ok: true;
  found: false;
};

export type WishKanbanBoardPersistedV1GetResponseDto =
  | WishKanbanBoardPersistedV1GetOkFoundDto
  | WishKanbanBoardPersistedV1GetOkEmptyDto
  | { ok: false; message: string };

export type WishKanbanBoardPersistedV1PutOkDto = {
  ok: true;
  updatedAt: string;
};

export type WishKanbanBoardPersistedV1PutResponseDto =
  | WishKanbanBoardPersistedV1PutOkDto
  | { ok: false; code?: string; message: string };
