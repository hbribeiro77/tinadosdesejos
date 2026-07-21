import type { WishKanbanBoard, WishKanbanCard } from "@/lib/wish-kanban-board-domain-types";

export type WishKanbanBoardSearchResultRowDtoV1 = {
  cardId: string;
  columnId: string;
  columnTitle: string;
  issueUrl: string;
  webUrl: string | null;
  iid: number | null;
  title: string;
  state: string | null;
};

function wishKanbanBoardSearchResultDisplayTitleForCard(card: WishKanbanCard): string {
  const fromSnapshot = card.snapshot?.data?.title?.trim();
  if (fromSnapshot) return fromSnapshot;
  const url = card.issueUrl.trim();
  if (url) return url;
  return "Sem título";
}

/**
 * Linhas ordenadas por coluna (ordem do quadro) e posição do card na coluna.
 */
export function wishKanbanBoardBuildSearchResultRowDtosFromBoardAndMatchingCardIdsV1(
  board: WishKanbanBoard,
  matchingCardIds: ReadonlySet<string>,
): WishKanbanBoardSearchResultRowDtoV1[] {
  const rows: WishKanbanBoardSearchResultRowDtoV1[] = [];

  for (const columnId of board.columnOrder) {
    const column = board.columnsById[columnId];
    if (!column) continue;

    const columnTitle = column.title.trim() || "Sem nome";

    for (const cardId of column.cardIds) {
      if (!matchingCardIds.has(cardId)) continue;

      const card = board.cardsById[cardId];
      if (!card) continue;

      const snapshot = card.snapshot?.data;

      rows.push({
        cardId,
        columnId,
        columnTitle,
        issueUrl: card.issueUrl,
        webUrl: snapshot?.webUrl ?? null,
        iid: snapshot?.iid ?? null,
        title: wishKanbanBoardSearchResultDisplayTitleForCard(card),
        state: snapshot?.state ?? null,
      });
    }
  }

  return rows;
}
