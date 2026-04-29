import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import type { WishKanbanBoard, WishKanbanCard } from "@/lib/wish-kanban-board-domain-types";

export function wishKanbanBoardAddCardFromTriagePreview(
  board: WishKanbanBoard,
  columnId: string,
  issueUrl: string,
  preview: GitLabIssueSummaryDto,
  insertIndex?: number,
): { board: WishKanbanBoard; cardId: string } {
  const cardId = crypto.randomUUID();
  const card: WishKanbanCard = {
    id: cardId,
    columnId,
    issueUrl,
    lastError: null,
    snapshot: { data: preview, fetchedAt: new Date().toISOString() },
  };
  return { board: wishKanbanBoardAddCardDraft(board, columnId, card, insertIndex), cardId };
}

export function wishKanbanBoardAddCardDraft(
  board: WishKanbanBoard,
  columnId: string,
  card: WishKanbanCard,
  insertIndex?: number,
) {
  const col = board.columnsById[columnId]!;
  const nextCardIds = [...col.cardIds];
  const safeIndex =
    insertIndex != null ? Math.min(Math.max(0, insertIndex), nextCardIds.length) : nextCardIds.length;
  nextCardIds.splice(safeIndex, 0, card.id);
  return {
    ...board,
    cardsById: { ...board.cardsById, [card.id]: card },
    columnsById: {
      ...board.columnsById,
      [columnId]: { ...col, cardIds: nextCardIds },
    },
  };
}

export function wishKanbanBoardRemoveCard(board: WishKanbanBoard, cardId: string) {
  const card = board.cardsById[cardId];
  if (!card) return board;

  const col = board.columnsById[card.columnId]!;
  const nextCardsById = { ...board.cardsById };
  delete nextCardsById[cardId];

  return {
    ...board,
    cardsById: nextCardsById,
    columnsById: {
      ...board.columnsById,
      [card.columnId]: { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) },
    },
  };
}

export function wishKanbanBoardUpsertCardSnapshot(board: WishKanbanBoard, cardId: string, data: GitLabIssueSummaryDto) {
  const card = board.cardsById[cardId];
  if (!card) return board;

  const nextCard: WishKanbanCard = {
    ...card,
    lastError: null,
    snapshot: { data, fetchedAt: new Date().toISOString() },
  };

  return {
    ...board,
    cardsById: { ...board.cardsById, [cardId]: nextCard },
  };
}

export function wishKanbanBoardSetCardError(board: WishKanbanBoard, cardId: string, message: string) {
  const card = board.cardsById[cardId];
  if (!card) return board;

  return {
    ...board,
    cardsById: {
      ...board.cardsById,
      [cardId]: { ...card, lastError: message },
    },
  };
}

export function wishKanbanBoardRenameColumn(board: WishKanbanBoard, columnId: string, title: string) {
  const col = board.columnsById[columnId];
  if (!col) return board;
  return {
    ...board,
    columnsById: {
      ...board.columnsById,
      [columnId]: { ...col, title },
    },
  };
}

export function wishKanbanBoardSetColumnCollapsed(board: WishKanbanBoard, columnId: string, collapsed: boolean) {
  const col = board.columnsById[columnId];
  if (!col) return board;
  return {
    ...board,
    columnsById: {
      ...board.columnsById,
      [columnId]: { ...col, collapsed },
    },
  };
}

export function wishKanbanBoardRenameBoard(board: WishKanbanBoard, title: string) {
  return { ...board, title };
}

export function wishKanbanBoardAddColumn(board: WishKanbanBoard): {
  board: WishKanbanBoard;
  addedColumnId: string;
} {
  const id = crypto.randomUUID();
  return {
    board: {
      ...board,
      columnOrder: [...board.columnOrder, id],
      columnsById: {
        ...board.columnsById,
        [id]: { id, title: "Nova coluna", cardIds: [], collapsed: false },
      },
    },
    addedColumnId: id,
  };
}

export function wishKanbanBoardDeleteColumn(board: WishKanbanBoard, columnId: string) {
  if (board.columnOrder.length <= 1) return board;

  const targetIndex = board.columnOrder.indexOf(columnId);
  if (targetIndex < 0) return board;

  const fallbackColumnId =
    board.columnOrder[targetIndex === 0 ? 1 : targetIndex - 1] ?? board.columnOrder[0]!;
  const deleted = board.columnsById[columnId]!;
  const fallbackCol = board.columnsById[fallbackColumnId]!;

  const nextCardsById = { ...board.cardsById };
  const movedCardIds: string[] = [];

  for (const cardId of deleted.cardIds) {
    const card = nextCardsById[cardId];
    if (!card) continue;
    nextCardsById[cardId] = { ...card, columnId: fallbackColumnId };
    movedCardIds.push(cardId);
  }

  const restColumns = { ...board.columnsById };
  delete restColumns[columnId];
  const nextColumnOrder = board.columnOrder.filter((id) => id !== columnId);

  return {
    ...board,
    columnOrder: nextColumnOrder,
    columnsById: {
      ...restColumns,
      [fallbackColumnId]: {
        ...fallbackCol,
        cardIds: [...fallbackCol.cardIds, ...movedCardIds],
      },
    },
    cardsById: nextCardsById,
  };
}
