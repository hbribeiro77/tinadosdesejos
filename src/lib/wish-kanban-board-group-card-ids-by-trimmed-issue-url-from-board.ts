import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";

/** Agrupa cards pela mesma URL — uma chamada à API por issue distinta. */
export function wishKanbanBoardGroupCardIdsByTrimmedIssueUrlFromBoard(
  board: WishKanbanBoard,
): Map<string, string[]> {
  const byUrl = new Map<string, string[]>();
  for (const colId of board.columnOrder) {
    const col = board.columnsById[colId];
    if (!col) continue;
    for (const cardId of col.cardIds) {
      const raw = board.cardsById[cardId]?.issueUrl;
      const url = typeof raw === "string" ? raw.trim() : "";
      if (!url) continue;
      const arr = byUrl.get(url) ?? [];
      arr.push(cardId);
      byUrl.set(url, arr);
    }
  }
  return byUrl;
}

export function wishKanbanBoardCountCardsWithNonEmptyIssueUrl(board: WishKanbanBoard): number {
  let n = 0;
  for (const colId of board.columnOrder) {
    const col = board.columnsById[colId];
    if (!col) continue;
    for (const cardId of col.cardIds) {
      const url = board.cardsById[cardId]?.issueUrl;
      if (typeof url === "string" && url.trim()) n += 1;
    }
  }
  return n;
}
