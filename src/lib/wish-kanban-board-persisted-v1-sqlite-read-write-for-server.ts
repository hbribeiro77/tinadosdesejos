import { eq } from "drizzle-orm";
import { getWishSqliteDrizzleDb } from "@/db/client";
import {
  WISH_KANBAN_BOARD_DEFAULT_PERSISTED_KEY,
  wishKanbanBoardPersistedV1,
} from "@/db/schema";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import {
  parseWishKanbanPersistedPayloadV1,
  stringifyWishKanbanBoard,
} from "@/lib/wish-board-localstorage-serialization";

export function parseWishKanbanBoardFromPersistedPayloadJsonForServer(
  payloadJson: string,
): WishKanbanBoard | null {
  const payload = parseWishKanbanPersistedPayloadV1(payloadJson);
  return payload?.board ?? null;
}

export function readWishKanbanBoardPersistedV1FromSqliteForServer(): {
  found: true;
  board: WishKanbanBoard;
  updatedAt: Date;
} | { found: false } {
  const db = getWishSqliteDrizzleDb();
  const rows = db
    .select()
    .from(wishKanbanBoardPersistedV1)
    .where(eq(wishKanbanBoardPersistedV1.boardKey, WISH_KANBAN_BOARD_DEFAULT_PERSISTED_KEY))
    .all();

  const row = rows[0];
  if (!row) return { found: false };

  const board = parseWishKanbanBoardFromPersistedPayloadJsonForServer(row.payloadJson);
  if (!board) return { found: false };

  return { found: true, board, updatedAt: row.updatedAt };
}

export function writeWishKanbanBoardPersistedV1ToSqliteForServer(board: WishKanbanBoard): Date {
  const now = new Date();
  const payloadJson = stringifyWishKanbanBoard(board);

  getWishSqliteDrizzleDb()
    .insert(wishKanbanBoardPersistedV1)
    .values({
      boardKey: WISH_KANBAN_BOARD_DEFAULT_PERSISTED_KEY,
      payloadJson,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: wishKanbanBoardPersistedV1.boardKey,
      set: { payloadJson, updatedAt: now },
    })
    .run();

  return now;
}
