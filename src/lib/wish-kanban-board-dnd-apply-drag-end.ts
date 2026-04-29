import { arrayMove } from "@dnd-kit/sortable";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";

export const WISH_KANBAN_COLUMN_CARDS_SORTABLE_CTX_PREFIX = "wish-cards:" as const;

export function wishKanbanColumnCardsSortableContextId(columnId: string) {
  return `${WISH_KANBAN_COLUMN_CARDS_SORTABLE_CTX_PREFIX}${columnId}`;
}

export const WISH_KANBAN_COLUMN_DROP_PREFIX = "wish-col:" as const;

export function wishKanbanColumnDropId(columnId: string) {
  return `${WISH_KANBAN_COLUMN_DROP_PREFIX}${columnId}`;
}

export function parseWishKanbanColumnDropId(overId: string): string | null {
  if (!overId.startsWith(WISH_KANBAN_COLUMN_DROP_PREFIX)) return null;
  return overId.slice(WISH_KANBAN_COLUMN_DROP_PREFIX.length);
}

export function findWishKanbanColumnIdContainingCard(board: WishKanbanBoard, cardId: string) {
  for (const colId of board.columnOrder) {
    const col = board.columnsById[colId]!;
    if (col.cardIds.includes(cardId)) return colId;
  }
  return null;
}

export function resolveWishKanbanOverColumnId(board: WishKanbanBoard, overId: string) {
  if (board.columnOrder.includes(overId)) return overId;
  return parseWishKanbanColumnDropId(overId) ?? findWishKanbanColumnIdContainingCard(board, overId);
}

export function applyWishKanbanColumnOrderDragEnd(board: WishKanbanBoard, activeColumnId: string, overId: string) {
  if (!board.columnOrder.includes(activeColumnId)) return board;

  let overColumnId: string | null = null;
  if (board.columnOrder.includes(overId)) {
    overColumnId = overId;
  } else {
    const fromDrop = parseWishKanbanColumnDropId(overId);
    if (fromDrop && board.columnsById[fromDrop]) {
      overColumnId = fromDrop;
    } else {
      overColumnId = findWishKanbanColumnIdContainingCard(board, overId);
    }
  }

  if (!overColumnId) return board;

  const oldIndex = board.columnOrder.indexOf(activeColumnId);
  const newIndex = board.columnOrder.indexOf(overColumnId);
  if (oldIndex < 0 || newIndex < 0) return board;
  if (oldIndex === newIndex) return board;

  return {
    ...board,
    columnOrder: arrayMove(board.columnOrder, oldIndex, newIndex),
  };
}

/**
 * Move um card diretamente para uma coluna em um índice específico.
 * Usado em drops cross-column onde o `insertIndex` já foi calculado com lógica
 * de top/bottom half no `onDragOver` (garantindo que placeholder == drop real).
 */
export function applyWishKanbanBoardCrossColumnMoveToIndex(
  board: WishKanbanBoard,
  activeId: string,
  targetColumnId: string,
  insertIndex: number,
): WishKanbanBoard {
  const sourceColumnId = findWishKanbanColumnIdContainingCard(board, activeId);
  if (!sourceColumnId) return board;

  const sourceColumn = board.columnsById[sourceColumnId]!;
  const targetColumn = board.columnsById[targetColumnId]!;

  const nextSourceCardIds = sourceColumn.cardIds.filter((id) => id !== activeId);
  const nextTargetCardIds = [...targetColumn.cardIds];
  const safeIndex = Math.min(Math.max(0, insertIndex), nextTargetCardIds.length);
  nextTargetCardIds.splice(safeIndex, 0, activeId);

  const movedCard = { ...board.cardsById[activeId]!, columnId: targetColumnId };

  return {
    ...board,
    columnsById: {
      ...board.columnsById,
      [sourceColumnId]: { ...sourceColumn, cardIds: nextSourceCardIds },
      [targetColumnId]: { ...targetColumn, cardIds: nextTargetCardIds },
    },
    cardsById: { ...board.cardsById, [activeId]: movedCard },
  };
}

export function applyWishKanbanBoardDragEnd(board: WishKanbanBoard, activeId: string, overId: string) {
  const activeColumnId = findWishKanbanColumnIdContainingCard(board, activeId);
  if (!activeColumnId) return board;

  const overColumnId = resolveWishKanbanOverColumnId(board, overId);
  if (!overColumnId) return board;

  const activeColumn = board.columnsById[activeColumnId]!;
  const overColumn = board.columnsById[overColumnId]!;

  const activeIndex = activeColumn.cardIds.indexOf(activeId);
  if (activeIndex < 0) return board;

  const droppedOnColumnSurface = Boolean(parseWishKanbanColumnDropId(overId));

  if (activeColumnId === overColumnId) {
    if (droppedOnColumnSurface) {
      const nextCardIds = arrayMove(activeColumn.cardIds, activeIndex, activeColumn.cardIds.length - 1);
      return {
        ...board,
        columnsById: {
          ...board.columnsById,
          [activeColumnId]: { ...activeColumn, cardIds: nextCardIds },
        },
      };
    }

    const overIndex = overColumn.cardIds.indexOf(overId);
    if (overIndex < 0) return board;
    if (activeIndex === overIndex) return board;

    const nextCardIds = arrayMove(activeColumn.cardIds, activeIndex, overIndex);
    return {
      ...board,
      columnsById: {
        ...board.columnsById,
        [activeColumnId]: { ...activeColumn, cardIds: nextCardIds },
      },
    };
  }

  const nextActiveCardIds = activeColumn.cardIds.filter((id) => id !== activeId);

  let insertIndex = overColumn.cardIds.length;
  if (!droppedOnColumnSurface) {
    const overIndex = overColumn.cardIds.indexOf(overId);
    if (overIndex >= 0) insertIndex = overIndex;
  }

  const nextOverCardIds = [...overColumn.cardIds];
  nextOverCardIds.splice(insertIndex, 0, activeId);

  const movedCard = board.cardsById[activeId]!;
  const nextMovedCard = { ...movedCard, columnId: overColumnId };

  return {
    ...board,
    columnsById: {
      ...board.columnsById,
      [activeColumnId]: { ...activeColumn, cardIds: nextActiveCardIds },
      [overColumnId]: { ...overColumn, cardIds: nextOverCardIds },
    },
    cardsById: {
      ...board.cardsById,
      [activeId]: nextMovedCard,
    },
  };
}
