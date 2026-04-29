"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { WishBoardModalAddGitlabIssueUrl } from "@/components/board/wish-board-modal-add-gitlab-issue-url";
import { WishKanbanBoardToolbarExportImportBoardJson } from "@/components/board/wish-kanban-board-toolbar-export-import-board-json";
import { WishKanbanColumnWithSortableCards } from "@/components/board/wish-kanban-column-with-sortable-cards";
import { clientFetchGitLabIssueResolve } from "@/lib/client-fetch-gitlab-issue-resolve-api";
import type { WishKanbanCard } from "@/lib/wish-kanban-board-domain-types";
import {
  applyWishKanbanBoardCrossColumnMoveToIndex,
  applyWishKanbanBoardDragEnd,
  applyWishKanbanColumnOrderDragEnd,
  findWishKanbanColumnIdContainingCard,
  parseWishKanbanColumnDropId,
  resolveWishKanbanOverColumnId,
} from "@/lib/wish-kanban-board-dnd-apply-drag-end";
import {
  wishKanbanBoardAddCardDraft,
  wishKanbanBoardAddCardFromTriagePreview,
  wishKanbanBoardAddColumn,
  wishKanbanBoardDeleteColumn,
  wishKanbanBoardRemoveCard,
  wishKanbanBoardRenameBoard,
  wishKanbanBoardRenameColumn,
  wishKanbanBoardSetCardError,
  wishKanbanBoardSetColumnCollapsed,
  wishKanbanBoardUpsertCardSnapshot,
} from "@/lib/wish-kanban-board-immutable-update-helpers";
import { wishKanbanBoardApplyBulkGitlabIssueResolveResponseBatchToBoard } from "@/lib/wish-kanban-board-apply-bulk-gitlab-issue-resolve-response-batch-to-board";
import { gitlabIssueUrlAlreadyPresentOnWishKanbanBoard } from "@/lib/gitlab-issue-url-canonical-key-for-board-match";
import { wishKanbanBoardComputeMatchingCardIdsForSearchQueryString } from "@/lib/wish-kanban-board-compute-matching-card-ids-for-search-query-string";
import {
  wishKanbanBoardCountCardsWithNonEmptyIssueUrl,
  wishKanbanBoardGroupCardIdsByTrimmedIssueUrlFromBoard,
} from "@/lib/wish-kanban-board-group-card-ids-by-trimmed-issue-url-from-board";
import {
  createEmptyWishKanbanBoard,
  readWishKanbanBoardFromLocalStorage,
  writeWishKanbanBoardToLocalStorage,
} from "@/lib/wish-board-localstorage-serialization";
import {
  WISH_GITLAB_TRIAGE_DND_KIND,
  type WishGitlabTriageDrawerDnDPayload,
} from "@/lib/wish-gitlab-triage-drawer-dnd-payload-types";
import {
  WishKanbanBoardDualSyncedHorizontalScrollbarsTopAndBottomClient,
  type WishKanbanBoardDualSyncedHorizontalScrollbarsHandle,
} from "@/components/board/wish-kanban-board-dual-synced-horizontal-scrollbars-top-and-bottom-client";
import { WishGitlabTriageDrawerPanelWithControlledIssuesList } from "@/components/board/wish-gitlab-triage-drawer-panel-with-controlled-issues-list";
import {
  WishKanbanBoardDndDragOverlayVisualPreviewsLayer,
  type WishKanbanBoardDndActiveDragOverlayModel,
} from "@/components/board/wish-kanban-board-dnd-drag-overlay-visual-previews-layer";
import { useWishTinaDialog } from "@/components/dialog/wish-tina-dialog-context-provider-client";

type AddIssueModalState =
  | { open: false }
  | { open: true; columnId: string };

export function WishKanbanBoardRootClient() {
  const tina = useWishTinaDialog();
  const [board, setBoard] = useState<ReturnType<typeof readWishKanbanBoardFromLocalStorage>>(null);
  const [addIssueModal, setAddIssueModal] = useState<AddIssueModalState>({ open: false });
  const [triageDrawerOpen, setTriageDrawerOpen] = useState(false);
  const [triageIssues, setTriageIssues] = useState<GitLabIssueSummaryDto[]>([]);
  const triageDropFollowUpRef = useRef<{ cardId: string; issueUrl: string } | null>(null);
  /** Ref da faixa horizontal real (`mainRef`) — scroll até o fim ao criar coluna. */
  const boardHorizontalScrollRef = useRef<WishKanbanBoardDualSyncedHorizontalScrollbarsHandle>(null);
  /** Dispara um ciclo `scrollLeft = máximo` no próximo layout após `Nova coluna`. */
  const pendingScrollHorizontalToMaximumRef = useRef(false);
  /**
   * Após «Nova coluna»: focar título da coluna criada. Não guardamos o UUID no ref — em dev o updater do
   * `setBoard` pode rodar 2× (Strict Mode) e o último id não bate com o estado commitado; usamos
   * `board.columnOrder.at(-1)` no layout effect.
   */
  const pendingFocusNewColumnTitleRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const [activeDragOverlay, setActiveDragOverlay] = useState<WishKanbanBoardDndActiveDragOverlayModel | null>(null);
  const [dragHighlightColumnId, setDragHighlightColumnId] = useState<string | null>(null);
  /** Placeholder estático na coluna alvo durante drag cross-column (sem mutação do board). */
  const [dragCrossColumnInsert, setDragCrossColumnInsert] = useState<{
    columnId: string;
    insertIndex: number;
  } | null>(null);
  const [boardBulkRefreshInProgress, setBoardBulkRefreshInProgress] = useState(false);
  const [boardSearchQuery, setBoardSearchQuery] = useState("");

  useEffect(() => {
    setBoard(readWishKanbanBoardFromLocalStorage() ?? createEmptyWishKanbanBoard());
  }, []);

  useEffect(() => {
    if (!board) return;
    writeWishKanbanBoardToLocalStorage(board);
  }, [board]);

  /** Gaveta alta empurrava o documento; ao fechar, volta o scroll da página para o topo. */
  useLayoutEffect(() => {
    if (triageDrawerOpen) return;
    if (typeof window === "undefined") return;
    if (window.scrollY <= 0) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [triageDrawerOpen]);

  /** Nova coluna: scroll até o fim (smooth) e só depois foco + seleção no título — evita o scroll roubar o foco. */
  useLayoutEffect(() => {
    const shouldScroll = pendingScrollHorizontalToMaximumRef.current;
    const shouldFocusTitle = pendingFocusNewColumnTitleRef.current;
    pendingScrollHorizontalToMaximumRef.current = false;
    pendingFocusNewColumnTitleRef.current = false;

    if (!shouldScroll && !shouldFocusTitle) return;

    const focusColumnId =
      shouldFocusTitle && board ? (board.columnOrder.at(-1) ?? undefined) : undefined;

    function focusColumnTitleInput(columnId: string) {
      const root = document.querySelector(
        `[data-wish-kanban-column-id="${CSS.escape(columnId)}"]`,
      );
      const input = root?.querySelector(
        'input[aria-label="Título da coluna"]',
      ) as HTMLInputElement | null;
      if (!input) return;
      input.focus({ preventScroll: true });
      input.select();
    }

    const scrollHandle = boardHorizontalScrollRef.current;

    if (shouldScroll && scrollHandle) {
      scrollHandle.scrollHorizontalToMaximum({
        onComplete: focusColumnId ? () => focusColumnTitleInput(focusColumnId) : undefined,
      });
      return;
    }

    if (shouldScroll && !scrollHandle && focusColumnId) {
      requestAnimationFrame(() => focusColumnTitleInput(focusColumnId));
      return;
    }

    if (focusColumnId) {
      requestAnimationFrame(() => focusColumnTitleInput(focusColumnId));
    }
  }, [board]);

  const modalColumnTitle = useMemo(() => {
    if (!board || !addIssueModal.open) return "";
    return board.columnsById[addIssueModal.columnId]?.title ?? "";
  }, [addIssueModal, board]);

  const searchMatchingCardIds = useMemo(() => {
    if (!board) return null;
    return wishKanbanBoardComputeMatchingCardIdsForSearchQueryString(board, boardSearchQuery);
  }, [board, boardSearchQuery]);

  const isCardMutedByBoardSearchFn =
    searchMatchingCardIds === null
      ? undefined
      : (cardId: string) => !searchMatchingCardIds.has(cardId);

  if (!board) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center text-sm text-zinc-600 dark:text-zinc-300">
        Carregando quadro...
      </div>
    );
  }

  function onDragStart(event: DragStartEvent) {
    if (!board) return;

    const activeId = String(event.active.id);
    const activeData = event.active.data.current;

    if (
      activeData &&
      typeof activeData === "object" &&
      "kind" in activeData &&
      (activeData as { kind?: unknown }).kind === WISH_GITLAB_TRIAGE_DND_KIND
    ) {
      const payload = activeData as WishGitlabTriageDrawerDnDPayload;
      setActiveDragOverlay({ kind: "triage", preview: payload.preview });
      return;
    }

    if (board.columnOrder.includes(activeId)) {
      const col = board.columnsById[activeId]!;
      setActiveDragOverlay({ kind: "column", title: col.title });
      return;
    }

    const card = board.cardsById[activeId];
    if (card) {
      setActiveDragOverlay({ kind: "card", card });
      return;
    }

    setActiveDragOverlay(null);
  }

  function onDragOver(event: DragOverEvent) {
    if (!board) return;
    const over = event.over;

    const overColumnId = over ? resolveWishKanbanOverColumnId(board, String(over.id)) : null;
    setDragHighlightColumnId((prev) => (prev === overColumnId ? prev : overColumnId));

    if (!over || !overColumnId) {
      setDragCrossColumnInsert((prev) => (prev === null ? prev : null));
      return;
    }

    const activeId = String(event.active.id);
    const overId = String(over.id);
    const activeData = event.active.data.current;

    // Coluna sendo reordenada: sem placeholder
    if (board.columnOrder.includes(activeId)) {
      setDragCrossColumnInsert((prev) => (prev === null ? prev : null));
      return;
    }

    const isTriage =
      activeData &&
      typeof activeData === "object" &&
      "kind" in activeData &&
      (activeData as { kind?: unknown }).kind === WISH_GITLAB_TRIAGE_DND_KIND;

    const sourceColumnId = isTriage ? null : findWishKanbanColumnIdContainingCard(board, activeId);

    // Mesmo coluna: sem placeholder cross-column
    if (!isTriage && sourceColumnId === overColumnId) {
      setDragCrossColumnInsert((prev) => (prev === null ? prev : null));
      return;
    }

    // Card cross-column ou triagem: calcular índice de inserção
    if (!isTriage && !sourceColumnId) {
      setDragCrossColumnInsert((prev) => (prev === null ? prev : null));
      return;
    }

    const overColumn = board.columnsById[overColumnId]!;
    const isColumnSurface = Boolean(parseWishKanbanColumnDropId(overId));

    let insertIndex = overColumn.cardIds.length; // padrão: final da coluna
    if (!isColumnSurface) {
      const idx = overColumn.cardIds.indexOf(overId);
      if (idx >= 0) {
        // Compara centro vertical do overlay com centro do card alvo.
        // Metade inferior → inserir depois; metade superior → inserir antes.
        const overRect = over.rect;
        const translated = event.active.rect.current.translated;
        const dragCenterY = translated ? translated.top + translated.height / 2 : null;
        const cardCenterY = overRect.top + overRect.height / 2;
        insertIndex = dragCenterY !== null && dragCenterY > cardCenterY ? idx + 1 : idx;
      }
    }

    // Deduplica via functional setState: só cria novo objeto se algo mudou
    setDragCrossColumnInsert((prev) => {
      if (prev && prev.columnId === overColumnId && prev.insertIndex === insertIndex) return prev;
      return { columnId: overColumnId, insertIndex };
    });
  }

  function clearDnDUiState() {
    setActiveDragOverlay(null);
    setDragHighlightColumnId(null);
    setDragCrossColumnInsert(null);
  }

  function onDragCancel() {
    clearDnDUiState();
  }

  function onDragEnd(event: DragEndEvent) {
    // Captura antes do clear: é a posição exata que o placeholder mostrou ao usuário.
    const pendingCrossInsert = dragCrossColumnInsert;
    clearDnDUiState();

    if (!board) return;

    const over = event.over;
    if (!over) return;

    const activeId = String(event.active.id);
    const overId = String(over.id);
    const activeData = event.active.data.current;

    // Reordenar colunas
    if (board.columnOrder.includes(activeId)) {
      setBoard((prev) => {
        if (!prev) return prev;
        return applyWishKanbanColumnOrderDragEnd(prev, activeId, overId);
      });
      return;
    }

    // Triagem: adicionar card na posição indicada pelo placeholder
    if (
      activeData &&
      typeof activeData === "object" &&
      "kind" in activeData &&
      (activeData as { kind?: unknown }).kind === WISH_GITLAB_TRIAGE_DND_KIND
    ) {
      const payload = activeData as WishGitlabTriageDrawerDnDPayload;
      const issueUrl = payload.issueUrl;

      triageDropFollowUpRef.current = null;

      setBoard((prev) => {
        if (!prev) return prev;
        // Usa columnId e insertIndex do placeholder — garante que o card cai
        // exatamente na posição visível, inclusive na última posição.
        const overColumnId =
          pendingCrossInsert?.columnId ?? resolveWishKanbanOverColumnId(prev, overId);
        if (!overColumnId) return prev;
        if (Object.values(prev.cardsById).some((c) => c.issueUrl === issueUrl)) return prev;
        const { board: next, cardId } = wishKanbanBoardAddCardFromTriagePreview(
          prev,
          overColumnId,
          issueUrl,
          payload.preview,
          pendingCrossInsert?.insertIndex,
        );
        triageDropFollowUpRef.current = { cardId, issueUrl };
        return next;
      });

      const followUp = triageDropFollowUpRef.current;
      triageDropFollowUpRef.current = null;
      if (followUp) {
        const { cardId, issueUrl: urlToResolve } = followUp;
        queueMicrotask(() => {
          void (async () => {
            const res = await clientFetchGitLabIssueResolve(urlToResolve);
            setBoard((b) => {
              if (!b || !b.cardsById[cardId]) return b;
              if (!res.ok) return wishKanbanBoardSetCardError(b, cardId, res.message);
              return wishKanbanBoardUpsertCardSnapshot(b, cardId, res.data);
            });
          })();
        });
      }

      setTriageIssues((prev) => prev.filter((i) => i.webUrl !== issueUrl));
      return;
    }

    // Drop cross-column: usa a posição exata calculada no onDragOver (top/bottom half).
    // Garante que o card caia exatamente onde o placeholder estava visível.
    if (pendingCrossInsert) {
      setBoard((prev) => {
        if (!prev) return prev;
        return applyWishKanbanBoardCrossColumnMoveToIndex(
          prev,
          activeId,
          pendingCrossInsert.columnId,
          pendingCrossInsert.insertIndex,
        );
      });
      return;
    }

    // Mesmo coluna: aplica reordenação normal via overId
    setBoard((prev) => {
      if (!prev) return prev;
      return applyWishKanbanBoardDragEnd(prev, activeId, overId);
    });
  }

  async function refreshCard(cardId: string) {
    const card = board?.cardsById[cardId];
    if (!card) return;

    const res = await clientFetchGitLabIssueResolve(card.issueUrl);
    setBoard((prev) => {
      if (!prev) return prev;
      if (!res.ok) return wishKanbanBoardSetCardError(prev, cardId, res.message);
      return wishKanbanBoardUpsertCardSnapshot(prev, cardId, res.data);
    });
  }

  async function refreshAllIssuesOnBoard() {
    if (!board || boardBulkRefreshInProgress) return;
    const urlToCardIds = wishKanbanBoardGroupCardIdsByTrimmedIssueUrlFromBoard(board);
    const distinctIssues = urlToCardIds.size;
    const cardCount = wishKanbanBoardCountCardsWithNonEmptyIssueUrl(board);
    if (distinctIssues === 0) return;

    const ok = await tina.confirm(
      `Atualizar todos os cards no GitLab?\n\n${cardCount} card(s), ${distinctIssues} issue(s) distinta(s).`,
    );
    if (!ok) return;

    const entries = [...urlToCardIds.entries()];
    const concurrency = 4;
    setBoardBulkRefreshInProgress(true);
    try {
      for (let i = 0; i < entries.length; i += concurrency) {
        const chunk = entries.slice(i, i + concurrency);
        const batch = await Promise.all(
          chunk.map(async ([issueUrl, cardIds]) => ({
            cardIds,
            res: await clientFetchGitLabIssueResolve(issueUrl),
          })),
        );
        setBoard((prev) => {
          if (!prev) return prev;
          return wishKanbanBoardApplyBulkGitlabIssueResolveResponseBatchToBoard(prev, batch);
        });
      }
    } finally {
      setBoardBulkRefreshInProgress(false);
    }
  }

  const boardCardCountForBulk = wishKanbanBoardCountCardsWithNonEmptyIssueUrl(board);
  const bulkRefreshDisabled = boardBulkRefreshInProgress || boardCardCountForBulk === 0;
  const boardIssueCountOnBoard = Object.keys(board.cardsById).length;
  const filteredIssueCount = searchMatchingCardIds ? searchMatchingCardIds.size : boardIssueCountOnBoard;
  const isSearchActive = boardSearchQuery.trim().length > 0;

  return (
    <div className="flex min-h-dvh w-full flex-col bg-zinc-100 dark:bg-zinc-950">
      <header className="flex shrink-0 flex-col gap-3 px-3 pb-3 pt-4 sm:px-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <input
              className="min-w-0 flex-1 truncate border-b border-transparent bg-transparent text-3xl font-bold tracking-tight text-zinc-950 outline-none transition-colors focus:border-black/10 dark:text-zinc-50 dark:focus:border-white/10"
              value={board.title}
              onChange={(e) => setBoard((prev) => (prev ? wishKanbanBoardRenameBoard(prev, e.target.value) : prev))}
              aria-label="Título do quadro"
              placeholder="Nome do quadro"
            />
            <span
              className="inline-flex shrink-0 items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-zinc-700 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
              title="Total de issues (cards) no quadro"
              aria-label={`${boardIssueCountOnBoard} issue${boardIssueCountOnBoard === 1 ? "" : "s"} no quadro`}
            >
              {boardIssueCountOnBoard}
            </span>
            <div className="relative min-w-[220px] flex-1 sm:min-w-[280px] md:max-w-md">
              <span className="sr-only">Buscar issues no quadro</span>
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                className="w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-20 text-sm text-zinc-900 shadow-sm outline-none ring-violet-400/40 placeholder:text-zinc-400 focus:border-violet-400/60 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-violet-500/50"
                placeholder="Buscar por título, #iid, URL, projeto, label…"
                value={boardSearchQuery}
                onChange={(e) => setBoardSearchQuery(e.target.value)}
                aria-label="Buscar issues no quadro"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {isSearchActive ? (
                  <span
                    className="inline-flex items-center rounded-md border border-violet-300/60 bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold text-violet-800 dark:border-violet-500/50 dark:bg-violet-950/50 dark:text-violet-200"
                    title="Issues encontradas pelo filtro"
                    aria-label={`${filteredIssueCount} issue${filteredIssueCount === 1 ? "" : "s"} encontradas pelo filtro`}
                  >
                    {filteredIssueCount}
                  </span>
                ) : null}
                {isSearchActive ? (
                  <button
                    type="button"
                    className="rounded-md p-1 text-zinc-400 hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                    aria-label="Limpar busca"
                    onClick={() => setBoardSearchQuery("")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Organize melhorias por área do sistema. Cada card é uma issue do GitLab (cole a URL). Use o ícone{" "}
            <span className="font-mono">⋮⋮</span> para reordenar colunas.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <WishKanbanBoardToolbarExportImportBoardJson
            board={board}
            onImportBoard={(next) => setBoard(next)}
          />
          <button
            type="button"
            disabled={bulkRefreshDisabled}
            aria-busy={boardBulkRefreshInProgress}
            title="Atualizar dados de todas as issues do quadro no GitLab"
            className={[
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition-colors",
              bulkRefreshDisabled
                ? "cursor-not-allowed border-black/10 bg-zinc-100 text-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-600"
                : "border-black/10 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
            ].join(" ")}
            onClick={() => void refreshAllIssuesOnBoard()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={boardBulkRefreshInProgress ? "animate-spin" : ""}
              aria-hidden
            >
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
            <span className="hidden sm:inline">
              {boardBulkRefreshInProgress ? "Atualizando…" : "Atualizar todas"}
            </span>
            <span className="sm:hidden">{boardBulkRefreshInProgress ? "…" : "Todas"}</span>
          </button>
          <div className="mx-1 hidden h-6 w-px bg-black/10 sm:block dark:bg-white/10"></div>
          <button
            type="button"
            className={[
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition-colors",
              triageDrawerOpen
                ? "border-violet-400/70 bg-violet-50 text-violet-950 hover:bg-violet-100 dark:border-violet-600/60 dark:bg-violet-950/60 dark:text-violet-50 dark:hover:bg-violet-900/50"
                : "border-black/10 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
            ].join(" ")}
            onClick={() => setTriageDrawerOpen((v) => !v)}
            aria-expanded={triageDrawerOpen}
            aria-controls="wish-gitlab-triage-drawer-panel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
            <span className="hidden sm:inline">Triagem</span> GitLab
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            onClick={() => {
              pendingScrollHorizontalToMaximumRef.current = true;
              pendingFocusNewColumnTitleRef.current = true;
              setBoard((prev) => {
                if (!prev) return prev;
                return wishKanbanBoardAddColumn(prev).board;
              });
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nova coluna
          </button>
        </div>
        </div>

      </header>

      <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pb-4 sm:px-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragCancel={onDragCancel}
            onDragEnd={onDragEnd}
          >
            <div className="flex min-h-0 min-w-0 flex-1 flex-row items-stretch overflow-hidden">
              <WishKanbanBoardDualSyncedHorizontalScrollbarsTopAndBottomClient ref={boardHorizontalScrollRef}>
                <SortableContext items={board.columnOrder} strategy={horizontalListSortingStrategy}>
                  <div className="flex gap-3 pb-2 sm:gap-4">
                    {board.columnOrder.map((columnId) => (
                      <WishKanbanColumnWithSortableCards
                        key={columnId}
                        board={board}
                        columnId={columnId}
                        isDropHighlight={dragHighlightColumnId === columnId}
                        insertBeforeIndex={
                          dragCrossColumnInsert?.columnId === columnId
                            ? dragCrossColumnInsert.insertIndex
                            : null
                        }
                        onAddCard={(colId) => setAddIssueModal({ open: true, columnId: colId })}
                        onRemoveCard={(cardId) =>
                          setBoard((prev) => (prev ? wishKanbanBoardRemoveCard(prev, cardId) : prev))
                        }
                        onRefreshCard={refreshCard}
                        onRenameColumn={(colId, title) =>
                          setBoard((prev) => (prev ? wishKanbanBoardRenameColumn(prev, colId, title) : prev))
                        }
                        onDeleteColumn={(colId) =>
                          setBoard((prev) => (prev ? wishKanbanBoardDeleteColumn(prev, colId) : prev))
                        }
                        onToggleColumnCollapsed={(colId, collapsed) =>
                          setBoard((prev) =>
                            prev ? wishKanbanBoardSetColumnCollapsed(prev, colId, collapsed) : prev,
                          )
                        }
                        isCardMutedByBoardSearch={isCardMutedByBoardSearchFn}
                      />
                    ))}
                  </div>
                </SortableContext>
              </WishKanbanBoardDualSyncedHorizontalScrollbarsTopAndBottomClient>

              <div
                className={[
                  "flex min-h-0 max-h-full min-w-0 shrink-0 flex-col overflow-hidden transition-[max-width] duration-300 ease-in-out",
                  triageDrawerOpen
                    ? "max-w-[min(100vw,440px)] border-l border-violet-300/60 shadow-[inset_1px_0_0_rgba(139,92,246,0.12),4px_0_28px_-12px_rgba(0,0,0,0.18)] dark:border-violet-700/45 dark:shadow-[inset_1px_0_0_rgba(167,139,250,0.08),4px_0_28px_-12px_rgba(0,0,0,0.45)]"
                    : "max-w-0 border-l border-transparent shadow-none",
                ].join(" ")}
              >
                <div className="flex h-full min-h-0 max-h-full w-[min(100vw,440px)] shrink-0 flex-col overflow-hidden">
                  <WishGitlabTriageDrawerPanelWithControlledIssuesList
                    open={triageDrawerOpen}
                    onClose={() => setTriageDrawerOpen(false)}
                    board={board}
                    issues={triageIssues}
                    setIssues={setTriageIssues}
                  />
                </div>
              </div>
            </div>

            <WishKanbanBoardDndDragOverlayVisualPreviewsLayer active={activeDragOverlay} />
          </DndContext>
        </div>
      </div>

      <WishBoardModalAddGitlabIssueUrl
        open={addIssueModal.open}
        columnTitle={modalColumnTitle}
        onClose={() => setAddIssueModal({ open: false })}
        onSubmit={async (issueUrl) => {
          if (!addIssueModal.open) return;

          if (board && gitlabIssueUrlAlreadyPresentOnWishKanbanBoard(board, issueUrl)) {
            throw new Error("Esta issue já está no quadro.");
          }

          const columnId = addIssueModal.columnId;
          const cardId = crypto.randomUUID();
          const draft: WishKanbanCard = { id: cardId, columnId, issueUrl, lastError: null };

          setBoard((prev) => (prev ? wishKanbanBoardAddCardDraft(prev, columnId, draft) : prev));

          const res = await clientFetchGitLabIssueResolve(issueUrl);
          if (!res.ok) {
            setBoard((prev) => {
              if (!prev) return prev;
              const withError = wishKanbanBoardSetCardError(prev, cardId, res.message);
              return withError;
            });
            throw new Error(res.message);
          }

          setBoard((prev) => (prev ? wishKanbanBoardUpsertCardSnapshot(prev, cardId, res.data) : prev));
        }}
      />
    </div>
  );
}
