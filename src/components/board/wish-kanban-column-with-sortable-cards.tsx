"use client";

import React, { useCallback, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import {
  wishKanbanColumnCardsSortableContextId,
  wishKanbanColumnDropId,
} from "@/lib/wish-kanban-board-dnd-apply-drag-end";
import { WishKanbanGitlabIssueCardView } from "@/components/board/wish-kanban-gitlab-issue-card-view";
import { useWishTinaDialog } from "@/components/dialog/wish-tina-dialog-context-provider-client";

type WishKanbanColumnWithSortableCardsProps = {
  board: WishKanbanBoard;
  columnId: string;
  isDropHighlight?: boolean;
  /** Índice antes do qual renderizar placeholder cross-column (não afeta o SortableContext). */
  insertBeforeIndex?: number | null;
  onAddCard: (columnId: string) => void;
  onRemoveCard: (cardId: string) => void;
  onRefreshCard: (cardId: string) => Promise<void>;
  /** Após `POST` DVITU bem-sucedido: mescla snapshot sem novo roundtrip de resolve. */
  onMergeGitlabSnapshotAfterDvitu?: (cardId: string, data: GitLabIssueSummaryDto) => void;
  onMergeGitlabSnapshotAfterGut?: (cardId: string, data: GitLabIssueSummaryDto) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onToggleColumnCollapsed: (columnId: string, collapsed: boolean) => void;
  /** Se definido, cards onde retorna `true` ficam esmaecidos (busca no quadro). */
  isCardMutedByBoardSearch?: (cardId: string) => boolean;
  /** Modo visualização: sem DnD, +Issue, renomear/apagar coluna. */
  viewOnly?: boolean;
};

/**
 * Monta a lista de cards intercalando o placeholder na posição correta.
 * Retorna um array flat de elementos React sem usar Fragments com key aninhada.
 */
function buildCardListWithPlaceholder(
  cardIds: string[],
  cardsById: Record<string, import("@/lib/wish-kanban-board-domain-types").WishKanbanCard | undefined>,
  insertBeforeIndex: number | null,
  onRemove: (id: string) => void,
  onRefresh: (id: string) => Promise<void>,
  onMergeGitlabSnapshotAfterDvitu: ((cardId: string, data: GitLabIssueSummaryDto) => void) | undefined,
  onMergeGitlabSnapshotAfterGut: ((cardId: string, data: GitLabIssueSummaryDto) => void) | undefined,
  isCardMutedByBoardSearch?: (cardId: string) => boolean,
  viewOnly?: boolean,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  cardIds.forEach((cardId, idx) => {
    if (insertBeforeIndex === idx) {
      nodes.push(<WishKanbanCrossColumnDropPlaceholder key="__drop-ph__" />);
    }
    const card = cardsById[cardId];
    if (card) {
      nodes.push(
        <WishKanbanGitlabIssueCardView
          key={card.id}
          card={card}
          onRemove={onRemove}
          onRefresh={onRefresh}
          onMergeGitlabSnapshotAfterDvitu={onMergeGitlabSnapshotAfterDvitu}
          onMergeGitlabSnapshotAfterGut={onMergeGitlabSnapshotAfterGut}
          mutedByBoardSearch={isCardMutedByBoardSearch?.(card.id) ?? false}
          viewOnly={viewOnly}
        />,
      );
    }
  });

  if (insertBeforeIndex != null && insertBeforeIndex >= cardIds.length) {
    nodes.push(<WishKanbanCrossColumnDropPlaceholder key="__drop-ph__" />);
  }

  return nodes;
}

/** Placeholder visual para drop cross-column — sem `useSortable`, não interfere no DnD context. */
function WishKanbanCrossColumnDropPlaceholder() {
  return (
    <div
      aria-hidden
      className="pointer-events-none h-[88px] animate-[wish-placeholder-in_150ms_ease-out] rounded-lg border-2 border-dashed border-sky-400/70 bg-sky-50/60 dark:border-sky-500/50 dark:bg-sky-950/30"
    />
  );
}

export function WishKanbanColumnWithSortableCards(props: WishKanbanColumnWithSortableCardsProps) {
  const tina = useWishTinaDialog();
  const viewOnly = Boolean(props.viewOnly);
  const column = props.board.columnsById[props.columnId]!;
  const collapsed = Boolean(column.collapsed);
  const cardCount = column.cardIds.length;
  const collapsedHint =
    `${column.title.trim() || "Sem nome"} — ${cardCount} ${cardCount === 1 ? "issue" : "issues"}`;

  const isMutedByBoardSearchFn = props.isCardMutedByBoardSearch;
  const visibleCardsForSearchCount = isMutedByBoardSearchFn
    ? column.cardIds.filter((id) => !isMutedByBoardSearchFn(id)).length
    : column.cardIds.length;
  const showSearchNoMatchInColumn =
    Boolean(isMutedByBoardSearchFn) && column.cardIds.length > 0 && visibleCardsForSearchCount === 0;
  const highlightColumnForBoardSearchMatch =
    Boolean(isMutedByBoardSearchFn) && visibleCardsForSearchCount > 0;

  const {
    attributes: columnSortableAttributes,
    listeners: columnSortableListeners,
    setNodeRef: setColumnSortableRef,
    transform: columnTransform,
    transition: columnTransition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: column.id,
    data: { kind: "wishKanbanColumn" as const },
    disabled: viewOnly,
  });

  /** Junta transição do DnD com largura — senão o `transition` inline do sortable apaga o animate de expand/collapse. */
  const columnSortableStyle = useMemo(() => {
    const widthEase = "cubic-bezier(0.33, 1, 0.68, 1)";
    const widthPart = `width 300ms ${widthEase}, min-width 300ms ${widthEase}`;
    const transition =
      columnTransition && String(columnTransition).trim()
        ? `${columnTransition}, ${widthPart}`
        : widthPart;
    return {
      transform: CSS.Transform.toString(columnTransform),
      transition,
    };
  }, [columnTransform, columnTransition]);

  const { setNodeRef: setColumnDropRef, isOver } = useDroppable({ id: wishKanbanColumnDropId(column.id) });
  const dropZoneHot = isOver || Boolean(props.isDropHighlight);

  const bindColumnDropRef = useCallback(
    (node: HTMLDivElement | null) => {
      setColumnDropRef(node);
    },
    [setColumnDropRef],
  );

  const columnShellClass = [
    "relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-black/10 bg-zinc-50 shadow-sm transition-[box-shadow,ring-color] duration-200 motion-reduce:transition-none dark:border-white/10 dark:bg-zinc-950/40",
    collapsed ? "w-[52px] min-w-[52px]" : "w-[380px] min-w-[360px]",
    isColumnDragging ? "z-20 opacity-90 ring-2 ring-zinc-400/60 dark:ring-zinc-600/60" : "",
    props.isDropHighlight && !isColumnDragging
      ? "ring-[3px] ring-sky-500/60 shadow-[0_0_0_4px_rgba(14,165,233,0.18)] dark:ring-sky-400/50 dark:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
      : "",
    highlightColumnForBoardSearchMatch && !isColumnDragging && !props.isDropHighlight
      ? "ring-[3px] ring-amber-400/85 shadow-[0_0_0_4px_rgba(251,191,36,0.28)] dark:ring-amber-400/70 dark:shadow-[0_0_0_4px_rgba(251,191,36,0.18)]"
      : "",
  ].join(" ");

  /** Visível no fluxo quando colapsada (senão o pai some: duas camadas `absolute` = altura 0). */
  const collapsedLayerClass = [
    "z-10 flex flex-col rounded-xl bg-zinc-50 motion-reduce:transition-none dark:bg-zinc-950/40",
    "transition-opacity duration-200 ease-out motion-reduce:transition-none",
    collapsed
      ? "relative min-h-[300px] w-full flex-1 opacity-100"
      : "pointer-events-none absolute inset-0 opacity-0",
  ].join(" ");

  const expandedLayerClass = [
    "flex min-h-0 flex-col motion-reduce:transition-none",
    "transition-opacity duration-200 ease-out motion-reduce:transition-none",
    collapsed
      ? "pointer-events-none absolute left-0 top-0 z-0 h-full min-h-[300px] w-[380px] min-w-[360px] opacity-0 select-none"
      : "relative z-0 h-full min-h-0 w-full min-w-0 flex-1 opacity-100 delay-75 motion-reduce:delay-0",
  ].join(" ");

  return (
    <div
      ref={setColumnSortableRef}
      data-wish-kanban-column-id={column.id}
      style={columnSortableStyle}
      className={columnShellClass}
    >
      {/* Camada colapsada — fade + largura animada no pai */}
      <div className={collapsedLayerClass}>
        <div className="flex flex-col items-center gap-1 border-b border-black/10 py-2 dark:border-white/10">
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10"
            aria-expanded={false}
            aria-label={`Expandir coluna “${column.title.trim() || "Sem nome"}”`}
            title={collapsedHint}
            onClick={() => props.onToggleColumnCollapsed(column.id, false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          {!viewOnly ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-zinc-400 hover:bg-black/5 hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-300"
              aria-label="Arrastar coluna para reordenar"
              title="Arrastar coluna"
              {...columnSortableAttributes}
              {...columnSortableListeners}
            >
              <span className="select-none text-sm leading-none tracking-tighter">⋮⋮</span>
            </button>
          ) : null}
        </div>

        <div
          ref={collapsed && !viewOnly ? bindColumnDropRef : undefined}
          title={collapsedHint}
          className={[
            "flex min-h-[200px] flex-1 flex-col items-center justify-start gap-2 px-1 pb-3 pt-2 transition-[background-color,outline-color,box-shadow] duration-150",
            dropZoneHot
              ? "bg-sky-100/85 outline outline-2 outline-offset-0 outline-dashed outline-sky-600 shadow-[inset_0_0_0_1px_rgba(2,132,199,0.25)] dark:bg-sky-950/45 dark:outline-sky-400 dark:shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]"
              : "",
          ].join(" ")}
        >
          <p
            className="max-h-[10rem] overflow-hidden text-ellipsis text-center text-xs font-semibold leading-snug text-zinc-800 [overflow-wrap:anywhere] [writing-mode:vertical-rl] dark:text-zinc-100"
            title={collapsedHint}
          >
            {column.title.trim() || "Sem nome"}
          </p>
          <span
            className="rounded-full bg-zinc-200/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-800 dark:bg-zinc-700/90 dark:text-zinc-100"
            title={collapsedHint}
          >
            {cardCount}
          </span>
        </div>

        {!viewOnly ? (
          <div className="flex flex-col items-center gap-1 border-t border-black/5 py-2 dark:border-white/5">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
              aria-label="Adicionar issue nesta coluna"
              title="Adicionar issue"
              onClick={() => props.onAddCard(column.id)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14"></path>
                <path d="M5 12h14"></path>
              </svg>
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              aria-label="Remover coluna"
              title="Remover coluna"
              onClick={async () => {
                const ok = await tina.confirm(
                  "Remover esta coluna? Os cards serão movidos para a coluna anterior (ou seguinte).",
                );
                if (!ok) return;
                props.onDeleteColumn(column.id);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      {/* Camada expandida — mantém cards montados para DnD */}
      <div className={expandedLayerClass}>
      <div className="flex items-center justify-between gap-2 border-b border-black/10 p-3 dark:border-white/10">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
            aria-expanded={true}
            aria-label={`Colapsar coluna “${column.title.trim() || "Sem nome"}”`}
            title="Colapsar coluna"
            onClick={() => props.onToggleColumnCollapsed(column.id, true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            {viewOnly ? (
              <div
                className="w-full truncate px-2 py-1.5 text-base font-semibold text-zinc-900 dark:text-zinc-50"
                title={column.title}
              >
                {column.title.trim() || "Sem nome"}
              </div>
            ) : (
              <input
                className="w-full truncate rounded-md bg-transparent px-2 py-1.5 text-base font-semibold text-zinc-900 outline-none ring-zinc-400 focus:bg-white focus:ring-2 dark:text-zinc-50 dark:focus:bg-zinc-900"
                value={column.title}
                onChange={(e) => props.onRenameColumn(column.id, e.target.value)}
                aria-label="Título da coluna"
                placeholder="Nome da coluna"
              />
            )}
          </div>
        </div>
        {!viewOnly ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-zinc-400 hover:bg-black/5 hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-300"
              aria-label="Arrastar coluna para reordenar"
              title="Arrastar coluna"
              {...columnSortableAttributes}
              {...columnSortableListeners}
            >
              <span className="select-none text-sm leading-none tracking-tighter">⋮⋮</span>
            </button>
          </div>
        ) : null}
      </div>

      <SortableContext
        id={wishKanbanColumnCardsSortableContextId(column.id)}
        items={column.cardIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={!collapsed && !viewOnly ? bindColumnDropRef : undefined}
          className={[
            "flex min-h-[220px] flex-col gap-3 p-3 transition-[background-color,outline-color,box-shadow] duration-150",
            dropZoneHot && !viewOnly
              ? "rounded-b-lg bg-sky-100/85 outline outline-2 outline-offset-0 outline-dashed outline-sky-600 shadow-[inset_0_0_0_1px_rgba(2,132,199,0.25)] dark:bg-sky-950/45 dark:outline-sky-400 dark:shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]"
              : "",
          ].join(" ")}
        >
          {showSearchNoMatchInColumn ? (
            <div className="rounded-lg border border-violet-200/80 bg-violet-50/95 px-3 py-2 text-center text-xs font-medium text-violet-950 dark:border-violet-700/55 dark:bg-violet-950/55 dark:text-violet-100">
              Nenhuma issue nesta coluna corresponde à busca.
            </div>
          ) : null}

          {column.cardIds.length === 0 && props.insertBeforeIndex == null ? (
            <div className="rounded-lg border border-dashed border-black/15 p-4 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              {viewOnly ? "Nenhuma issue nesta coluna." : (
                <>
                  Arraste issues para cá ou clique em <span className="font-medium">+ Issue</span> no rodapé.
                </>
              )}
            </div>
          ) : null}

          {buildCardListWithPlaceholder(
            column.cardIds,
            props.board.cardsById,
            viewOnly ? null : (props.insertBeforeIndex ?? null),
            props.onRemoveCard,
            props.onRefreshCard,
            props.onMergeGitlabSnapshotAfterDvitu,
            props.onMergeGitlabSnapshotAfterGut,
            props.isCardMutedByBoardSearch,
            viewOnly,
          )}
        </div>
      </SortableContext>

      {!viewOnly ? (
        <div className="flex items-center justify-between border-t border-black/5 p-2 dark:border-white/5">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
            onClick={() => props.onAddCard(column.id)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
            Adicionar Issue
          </button>
          <button
            type="button"
            className="rounded-md p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            title="Remover coluna"
            onClick={async () => {
              const ok = await tina.confirm(
                "Remover esta coluna? Os cards serão movidos para a coluna anterior (ou seguinte).",
              );
              if (!ok) return;
              props.onDeleteColumn(column.id);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      ) : null}
      </div>
    </div>
  );
}
