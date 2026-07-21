"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";
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
import type { WishKanbanBoard, WishKanbanCard } from "@/lib/wish-kanban-board-domain-types";
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
  wishKanbanBoardCountCardsWithResolvableGitLabIssueUrl,
  wishKanbanBoardGroupCardIdsByTrimmedIssueUrlFromBoard,
} from "@/lib/wish-kanban-board-group-card-ids-by-trimmed-issue-url-from-board";
import { clientFetchWishKanbanBoardPersistedV1Put } from "@/lib/client-fetch-wish-kanban-board-persisted-v1-api";
import { clientFetchWishSmartTaskImportedTasksPersistedV1Put } from "@/lib/client-fetch-wish-smart-task-imported-tasks-persisted-v1-api";
import { clientFetchWishAppAccessGateV1Delete } from "@/lib/client-fetch-wish-app-access-gate-v1-api";
import { clientFetchWishAppRuntimeFlagsV1Get } from "@/lib/client-fetch-wish-app-runtime-flags-v1-api";
import {
  createEmptyWishKanbanBoard,
  readWishKanbanBoardFromLocalStorage,
} from "@/lib/wish-board-localstorage-serialization";
import { hydrateWishKanbanBoardAndSmartTaskFromServerWithLocalStorageMigrationV1 } from "@/lib/hydrate-wish-kanban-board-and-smart-task-from-server-with-local-storage-migration-v1";
import { readWishSmartTaskImportedTasksFromLocalStorage } from "@/lib/wish-smart-task-imported-tasks-local-storage-serialization";
import {
  wishViewOnlyModeReadSessionPreviewToggleFromStorageV1,
  wishViewOnlyModeWriteSessionPreviewToggleToStorageV1,
} from "@/lib/wish-view-only-mode-session-preview-toggle-storage-v1";
import {
  WISH_GITLAB_TRIAGE_DND_KIND,
  type WishGitlabTriageDrawerDnDPayload,
} from "@/lib/wish-gitlab-triage-drawer-dnd-payload-types";
import {
  WISH_SMARTTASK_TRIAGE_DND_KIND,
  type WishSmartTaskTriageDrawerDnDPayload,
} from "@/lib/wish-smart-task-triage-drawer-dnd-payload-types";
import {
  isSmartTaskKanbanIssueUrl,
  parseSmartTaskIdFromKanbanIssueUrl,
} from "@/lib/smart-task-kanban-issue-url-build-and-parse-task-id";
import { mergeSmartTaskNormalizedTaskArrayByIdPreferIncoming } from "@/lib/merge-smart-task-normalized-task-array-by-id-prefer-incoming";
import { parseWishSmartTaskHandoffHashFromWindowLocationV1 } from "@/lib/wish-smart-task-parse-handoff-hash-from-window-location-v1";
import { wishSmartTaskReadBrowserLocationHashFragmentForHandoffOrEmptyV1 } from "@/lib/wish-smart-task-read-browser-location-hash-fragment-for-handoff-or-empty-v1";
import { WISH_SMARTTASK_HANDOFF_POST_MESSAGE_TYPE_V1 } from "@/lib/wish-smart-task-handoff-post-message-type-v1-constant";
import { wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1 } from "@/lib/wish-smart-task-is-http-origin-allowed-for-post-message-handoff-from-smarttask-v1";
import {
  WishKanbanBoardDualSyncedHorizontalScrollbarsTopAndBottomClient,
  type WishKanbanBoardDualSyncedHorizontalScrollbarsHandle,
} from "@/components/board/wish-kanban-board-dual-synced-horizontal-scrollbars-top-and-bottom-client";
import { WishGitlabTriageDrawerPanelWithControlledIssuesList } from "@/components/board/wish-gitlab-triage-drawer-panel-with-controlled-issues-list";
import {
  WishKanbanBoardDndDragOverlayVisualPreviewsLayer,
  type WishKanbanBoardDndActiveDragOverlayModel,
} from "@/components/board/wish-kanban-board-dnd-drag-overlay-visual-previews-layer";
import { WishKanbanBoardSearchInputWithLabelAutocompleteDropdownClient } from "@/components/board/wish-kanban-board-search-input-with-label-autocomplete-dropdown-client";
import { WishKanbanBoardModalSearchResultsMatchingIssuesListClient } from "@/components/board/wish-kanban-board-modal-search-results-matching-issues-list-client";
import { wishKanbanBoardFocusCardInDomScrollColumnAndCardWithPulseHighlightV1 } from "@/lib/wish-kanban-board-focus-card-in-dom-scroll-column-and-card-with-pulse-highlight-v1";
import { useWishTinaDialog } from "@/components/dialog/wish-tina-dialog-context-provider-client";

type AddIssueModalState =
  | { open: false }
  | { open: true; columnId: string };

function activeDataIsWishTriageDrawerDnD(
  activeData: unknown,
): activeData is WishGitlabTriageDrawerDnDPayload | WishSmartTaskTriageDrawerDnDPayload {
  if (!activeData || typeof activeData !== "object" || !("kind" in activeData)) return false;
  const k = (activeData as { kind?: unknown }).kind;
  return k === WISH_GITLAB_TRIAGE_DND_KIND || k === WISH_SMARTTASK_TRIAGE_DND_KIND;
}

/** Remove `st-handoff` da query e/ou o fragmento com handoff, sem recarregar a página. */
function stripWishSmartTaskHandoffParamsFromWindowLocationBarV1() {
  if (typeof window === "undefined") return;
  const { pathname, search, hash } = window.location;
  let nextSearch = search;
  if (search.includes("st-handoff")) {
    const sp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : "");
    sp.delete("st-handoff");
    nextSearch = sp.toString() ? `?${sp.toString()}` : "";
  }
  const nextHash = hash.includes("st-handoff") ? "" : hash;
  window.history.replaceState(null, "", `${pathname}${nextSearch}${nextHash}`);
}

const WISH_SERVER_PERSIST_DEBOUNCE_MS = 450;

export function WishKanbanBoardRootClient() {
  const tina = useWishTinaDialog();
  const tinaRef = useRef(tina);
  tinaRef.current = tina;
  const [board, setBoard] = useState<WishKanbanBoard | null>(null);
  const [boardHydratedFromServer, setBoardHydratedFromServer] = useState(false);
  const [boardHydrateErrorMessage, setBoardHydrateErrorMessage] = useState<string | null>(null);
  const [addIssueModal, setAddIssueModal] = useState<AddIssueModalState>({ open: false });
  const [triageDrawerOpen, setTriageDrawerOpen] = useState(false);
  const [triageIssues, setTriageIssues] = useState<GitLabIssueSummaryDto[]>([]);
  const [smartTaskTasks, setSmartTaskTasks] = useState<SmartTaskNormalizedTask[]>([]);
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
  const [boardSearchResultsModalOpen, setBoardSearchResultsModalOpen] = useState(false);
  const [serverViewOnlyMode, setServerViewOnlyMode] = useState(false);
  const [boardImportRequiresApiKey, setBoardImportRequiresApiKey] = useState(false);
  const [accessGateRequired, setAccessGateRequired] = useState(false);
  const [previewViewOnlyMode, setPreviewViewOnlyMode] = useState(() =>
    wishViewOnlyModeReadSessionPreviewToggleFromStorageV1(),
  );
  const viewOnly = serverViewOnlyMode || previewViewOnlyMode;
  const viewOnlyRef = useRef(viewOnly);
  viewOnlyRef.current = viewOnly;

  const applySmartTaskHandoffNormalizedTasks = useCallback((incoming: SmartTaskNormalizedTask[]) => {
    if (viewOnlyRef.current) return;
    setSmartTaskTasks((prev) => mergeSmartTaskNormalizedTaskArrayByIdPreferIncoming(prev, incoming));
    setTriageDrawerOpen(true);
    if (
      typeof window !== "undefined" &&
      (window.location.hash.includes("st-handoff") || window.location.search.includes("st-handoff"))
    ) {
      stripWishSmartTaskHandoffParamsFromWindowLocationBarV1();
    }
  }, []);

  const runBoardHydrationFromServerV1 = useCallback(() => {
    setBoardHydrateErrorMessage(null);
    setBoard(null);
    setBoardHydratedFromServer(false);

    let cancelled = false;
    void (async () => {
      try {
        const flags = await clientFetchWishAppRuntimeFlagsV1Get();
        if (cancelled) return;
        const serverFlag = flags.ok ? flags.viewOnlyMode : false;
        setServerViewOnlyMode(serverFlag);
        setBoardImportRequiresApiKey(flags.ok ? flags.boardImportRequiresApiKey : false);
        setAccessGateRequired(flags.ok ? flags.accessGateRequired : false);
        const effectiveViewOnly =
          serverFlag || wishViewOnlyModeReadSessionPreviewToggleFromStorageV1();

        const hydrated = await hydrateWishKanbanBoardAndSmartTaskFromServerWithLocalStorageMigrationV1();
        if (cancelled) return;

        let smartTasks = hydrated.smartTaskTasks;

        if (!effectiveViewOnly && typeof window !== "undefined") {
          const hash = wishSmartTaskReadBrowserLocationHashFragmentForHandoffOrEmptyV1();
          const search = window.location.search ?? "";
          const hasHandoffMarker = hash.includes("st-handoff") || search.includes("st-handoff");
          if (hasHandoffMarker) {
            const parsed = parseWishSmartTaskHandoffHashFromWindowLocationV1(hash, search);
            if (parsed.ok) {
              smartTasks = mergeSmartTaskNormalizedTaskArrayByIdPreferIncoming(smartTasks, parsed.tasks);
              stripWishSmartTaskHandoffParamsFromWindowLocationBarV1();
              setTriageDrawerOpen(true);
            } else if (process.env.NODE_ENV === "development") {
              console.warn("[Tina / SmartTask handoff] Falha ao interpretar URL:", parsed.message);
            }
          }
        } else if (effectiveViewOnly && typeof window !== "undefined") {
          const hash = wishSmartTaskReadBrowserLocationHashFragmentForHandoffOrEmptyV1();
          const search = window.location.search ?? "";
          if (hash.includes("st-handoff") || search.includes("st-handoff")) {
            stripWishSmartTaskHandoffParamsFromWindowLocationBarV1();
          }
        }

        setBoard(hydrated.board);
        setSmartTaskTasks(smartTasks);

        if (hydrated.errors.length > 0) {
          const msg = hydrated.errors.join("\n");
          setBoardHydrateErrorMessage(msg);
          void tinaRef.current.alert(
            `Alguns dados não foram sincronizados com o servidor:\n\n${msg}`,
          );
        }
      } catch (cause) {
        if (cancelled) return;
        console.error("[Tina] Falha ao hidratar quadro:", cause);
        const fallbackBoard = readWishKanbanBoardFromLocalStorage() ?? createEmptyWishKanbanBoard();
        const fallbackTasks = readWishSmartTaskImportedTasksFromLocalStorage() ?? [];
        setBoard(fallbackBoard);
        setSmartTaskTasks(fallbackTasks);
        const msg =
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar o quadro do servidor. Usando cópia local ou quadro vazio.";
        setBoardHydrateErrorMessage(msg);
        void tinaRef.current.alert(msg);
      } finally {
        if (!cancelled) {
          setBoard((current) => current ?? readWishKanbanBoardFromLocalStorage() ?? createEmptyWishKanbanBoard());
          setBoardHydratedFromServer(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancel = runBoardHydrationFromServerV1();
    return cancel;
  }, [runBoardHydrationFromServerV1]);

  useEffect(() => {
    if (!board || !boardHydratedFromServer || viewOnly) return;
    const timer = window.setTimeout(() => {
      void clientFetchWishKanbanBoardPersistedV1Put(board).then((res) => {
        if (!res.ok) {
          console.error("[Tina] Falha ao salvar quadro no servidor:", res.message);
        }
      });
    }, WISH_SERVER_PERSIST_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [board, boardHydratedFromServer, viewOnly]);

  useEffect(() => {
    if (!boardHydratedFromServer || viewOnly) return;
    const timer = window.setTimeout(() => {
      void clientFetchWishSmartTaskImportedTasksPersistedV1Put(smartTaskTasks).then((res) => {
        if (!res.ok) {
          console.error("[Tina] Falha ao salvar SmartTask no servidor:", res.message);
        }
      });
    }, WISH_SERVER_PERSIST_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [smartTaskTasks, boardHydratedFromServer, viewOnly]);

  useEffect(() => {
    if (viewOnly) setTriageDrawerOpen(false);
  }, [viewOnly]);

  /**
   * Fallback quando o fragmento URL se perde: SmartTask envia o mesmo payload via `postMessage`.
   * Só após hidratar do servidor para não ser sobrescrito pela carga inicial.
   */
  useLayoutEffect(() => {
    if (!boardHydratedFromServer || viewOnly) return;
    function onMessage(e: MessageEvent) {
      if (!wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1(e.origin)) return;
      const data = e.data;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: unknown }).type !== WISH_SMARTTASK_HANDOFF_POST_MESSAGE_TYPE_V1) return;
      const payload = (data as { payload?: unknown }).payload;
      if (typeof payload !== "string" || !payload.trim()) return;
      const parsed = parseWishSmartTaskHandoffHashFromWindowLocationV1(`#st-handoff=${payload.trim()}`, "");
      if (!parsed.ok) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[Tina / SmartTask handoff] postMessage inválido:", parsed.message);
        }
        return;
      }
      applySmartTaskHandoffNormalizedTasks(parsed.tasks);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [boardHydratedFromServer, applySmartTaskHandoffNormalizedTasks, viewOnly]);

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

  useEffect(() => {
    if (!boardSearchQuery.trim()) {
      setBoardSearchResultsModalOpen(false);
    }
  }, [boardSearchQuery]);

  const navigateToBoardSearchResultCard = useCallback(
    (cardId: string, columnId: string) => {
      setBoardSearchResultsModalOpen(false);

      const needsExpand = Boolean(board?.columnsById[columnId]?.collapsed);

      if (needsExpand) {
        setBoard((prev) =>
          prev ? wishKanbanBoardSetColumnCollapsed(prev, columnId, false) : prev,
        );
      }

      window.setTimeout(
        () => {
          wishKanbanBoardFocusCardInDomScrollColumnAndCardWithPulseHighlightV1(cardId, columnId);
        },
        needsExpand ? 360 : 0,
      );
    },
    [board],
  );

  const mergeGitlabSnapshotAfterDvitu = useCallback((cardId: string, data: GitLabIssueSummaryDto) => {
    setBoard((prev) => (prev ? wishKanbanBoardUpsertCardSnapshot(prev, cardId, data) : prev));
  }, []);

  const mergeGitlabSnapshotAfterGut = useCallback((cardId: string, data: GitLabIssueSummaryDto) => {
    setBoard((prev) => (prev ? wishKanbanBoardUpsertCardSnapshot(prev, cardId, data) : prev));
  }, []);

  if (!board) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 px-4 text-center text-sm text-zinc-600 dark:text-zinc-300">
        <p>Carregando quadro...</p>
        {boardHydrateErrorMessage ? (
          <p className="max-w-md text-xs text-amber-800 dark:text-amber-200">{boardHydrateErrorMessage}</p>
        ) : null}
        <button
          type="button"
          className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          onClick={() => runBoardHydrationFromServerV1()}
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  function onDragStart(event: DragStartEvent) {
    if (!board || viewOnly) return;

    const activeId = String(event.active.id);
    const activeData = event.active.data.current;

    if (activeDataIsWishTriageDrawerDnD(activeData)) {
      const payload = activeData;
      setActiveDragOverlay(
        payload.kind === WISH_SMARTTASK_TRIAGE_DND_KIND
          ? { kind: "triageSmartTask", preview: payload.preview }
          : { kind: "triage", preview: payload.preview },
      );
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
    if (!board || viewOnly) return;
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

    const isTriage = activeDataIsWishTriageDrawerDnD(activeData);

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
    if (viewOnly) {
      clearDnDUiState();
      return;
    }
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

    // Triagem (GitLab ou SmartTask): adicionar card na posição indicada pelo placeholder
    if (activeDataIsWishTriageDrawerDnD(activeData)) {
      const payload = activeData;
      const issueUrl = payload.issueUrl;
      const isGitLabTriage = payload.kind === WISH_GITLAB_TRIAGE_DND_KIND;

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
        if (isGitLabTriage) {
          triageDropFollowUpRef.current = { cardId, issueUrl };
        }
        return next;
      });

      const followUp = triageDropFollowUpRef.current;
      triageDropFollowUpRef.current = null;
      if (followUp && isGitLabTriage) {
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

      if (isGitLabTriage) {
        setTriageIssues((prev) => prev.filter((i) => i.webUrl !== issueUrl));
      } else {
        const sid = parseSmartTaskIdFromKanbanIssueUrl(issueUrl);
        if (sid) {
          setSmartTaskTasks((prev) => prev.filter((t) => t.id !== sid));
        }
      }
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
    if (isSmartTaskKanbanIssueUrl(card.issueUrl)) return;

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
    const cardCount = wishKanbanBoardCountCardsWithResolvableGitLabIssueUrl(board);
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

  const boardCardCountForBulk = wishKanbanBoardCountCardsWithResolvableGitLabIssueUrl(board);
  const bulkRefreshDisabled = boardBulkRefreshInProgress || boardCardCountForBulk === 0;
  const boardIssueCountOnBoard = Object.keys(board.cardsById).length;
  const filteredIssueCount = searchMatchingCardIds ? searchMatchingCardIds.size : boardIssueCountOnBoard;

  return (
    <div className="flex min-h-dvh w-full flex-col bg-zinc-100 dark:bg-zinc-950">
      {viewOnly ? (
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/50 dark:text-amber-50 sm:px-4"
          role="status"
        >
          <span className="font-medium">
            Modo visualização
            {serverViewOnlyMode ? null : " (prévia local — só UI)"}
          </span>
          <span className="text-xs opacity-90">
            Busca, descrição e Importar/Exportar JSON liberados; sem editar o quadro nem GitLab.
          </span>
        </div>
      ) : null}
      <header className="flex shrink-0 flex-col gap-3 px-3 pb-3 pt-4 sm:px-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {viewOnly ? (
              <h1 className="min-w-0 flex-1 truncate text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                {board.title.trim() || "Quadro"}
              </h1>
            ) : (
              <input
                className="min-w-0 flex-1 truncate border-b border-transparent bg-transparent text-3xl font-bold tracking-tight text-zinc-950 outline-none transition-colors focus:border-black/10 dark:text-zinc-50 dark:focus:border-white/10"
                value={board.title}
                onChange={(e) => setBoard((prev) => (prev ? wishKanbanBoardRenameBoard(prev, e.target.value) : prev))}
                aria-label="Título do quadro"
                placeholder="Nome do quadro"
              />
            )}
            <span
              className="inline-flex shrink-0 items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-zinc-700 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
              title="Total de issues (cards) no quadro"
              aria-label={`${boardIssueCountOnBoard} issue${boardIssueCountOnBoard === 1 ? "" : "s"} no quadro`}
            >
              {boardIssueCountOnBoard}
            </span>
            <WishKanbanBoardSearchInputWithLabelAutocompleteDropdownClient
              board={board}
              value={boardSearchQuery}
              onValueChange={setBoardSearchQuery}
              filteredIssueCount={filteredIssueCount}
              onOpenSearchResults={
                searchMatchingCardIds !== null ? () => setBoardSearchResultsModalOpen(true) : undefined
              }
            />
          </div>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {viewOnly
              ? "Visualização do quadro. Use Importar JSON para atualizar o snapshot neste servidor."
              : (
                <>
                  Organize melhorias por área do sistema. Cada card é uma issue do GitLab (cole a URL). Use o ícone{" "}
                  <span className="font-mono">⋮⋮</span> para reordenar colunas.
                </>
              )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <WishKanbanBoardToolbarExportImportBoardJson
            board={board}
            onImportBoard={(next) => setBoard(next)}
            boardImportRequiresApiKey={boardImportRequiresApiKey}
          />
          {accessGateRequired ? (
            <button
              type="button"
              title="Encerrar sessão de acesso deste navegador"
              className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
              onClick={() => {
                void (async () => {
                  await clientFetchWishAppAccessGateV1Delete();
                  window.location.href = "/entrar";
                })();
              }}
            >
              Sair
            </button>
          ) : null}
          {!serverViewOnlyMode ? (
            <button
              type="button"
              aria-pressed={previewViewOnlyMode}
              title={
                previewViewOnlyMode
                  ? "Desligar prévia de produção (volta o editor completo)"
                  : "Prévia do modo visualização de produção (só UI; APIs continuam abertas)"
              }
              className={[
                "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition-colors",
                previewViewOnlyMode
                  ? "border-amber-400/80 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-600/60 dark:bg-amber-950/50 dark:text-amber-50 dark:hover:bg-amber-900/40"
                  : "border-black/10 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
              ].join(" ")}
              onClick={() => {
                setPreviewViewOnlyMode((prev) => {
                  const next = !prev;
                  wishViewOnlyModeWriteSessionPreviewToggleToStorageV1(next);
                  return next;
                });
              }}
            >
              <span className="hidden sm:inline">Prévia produção</span>
              <span className="sm:hidden">Prévia</span>
            </button>
          ) : null}
          {!viewOnly ? (
            <>
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
            </>
          ) : null}
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
                        onMergeGitlabSnapshotAfterDvitu={mergeGitlabSnapshotAfterDvitu}
                        onMergeGitlabSnapshotAfterGut={mergeGitlabSnapshotAfterGut}
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
                        viewOnly={viewOnly}
                      />
                    ))}
                  </div>
                </SortableContext>
              </WishKanbanBoardDualSyncedHorizontalScrollbarsTopAndBottomClient>

              {!viewOnly ? (
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
                      smartTaskTasks={smartTaskTasks}
                      setSmartTaskTasks={setSmartTaskTasks}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <WishKanbanBoardDndDragOverlayVisualPreviewsLayer active={activeDragOverlay} />
          </DndContext>
        </div>
      </div>

      <WishBoardModalAddGitlabIssueUrl
        open={!viewOnly && addIssueModal.open}
        columnTitle={modalColumnTitle}
        onClose={() => setAddIssueModal({ open: false })}
        onSubmit={async (issueUrl) => {
          if (viewOnly || !addIssueModal.open) return;

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

      {searchMatchingCardIds !== null ? (
        <WishKanbanBoardModalSearchResultsMatchingIssuesListClient
          open={boardSearchResultsModalOpen}
          searchQuery={boardSearchQuery}
          board={board}
          matchingCardIds={searchMatchingCardIds}
          onClose={() => setBoardSearchResultsModalOpen(false)}
          onSelectCard={navigateToBoardSearchResultCard}
        />
      ) : null}
    </div>
  );
}
