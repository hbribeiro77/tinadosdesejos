import type { WishKanbanBoard, WishKanbanCard } from "@/lib/wish-kanban-board-domain-types";

export type WishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1 = {
  remoteBoardMissing: boolean;
  boardTitleChanged: boolean;
  columnsAdded: number;
  columnsRemoved: number;
  columnsRenamedOrReordered: number;
  cardsAdded: number;
  cardsRemoved: number;
  cardsChanged: number;
  /** Texto curto em pt-BR para o diálogo de confirmação. */
  summaryPtBr: string;
};

function cardFingerprintForPublishDiffV1(card: WishKanbanCard): string {
  return JSON.stringify({
    columnId: card.columnId,
    issueUrl: card.issueUrl,
    lastError: card.lastError ?? null,
    fetchedAt: card.snapshot?.fetchedAt ?? null,
    title: card.snapshot?.data?.title ?? null,
    state: card.snapshot?.data?.state ?? null,
    updatedAt: card.snapshot?.data?.updatedAt ?? null,
    labels: card.snapshot?.data?.labels ?? [],
    description: card.snapshot?.data?.gitlabDescriptionMarkdown ?? null,
  });
}

function buildSummaryPtBr(
  d: Omit<WishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1, "summaryPtBr">,
): string {
  if (d.remoteBoardMissing) {
    return "A VPS ainda não tem quadro. A publicação enviará o quadro local completo.";
  }
  const parts: string[] = [];
  if (d.boardTitleChanged) parts.push("título do quadro alterado");
  if (d.columnsAdded) parts.push(`+${d.columnsAdded} coluna(s)`);
  if (d.columnsRemoved) parts.push(`−${d.columnsRemoved} coluna(s)`);
  if (d.columnsRenamedOrReordered) parts.push(`${d.columnsRenamedOrReordered} coluna(s) renomeada(s)/reordenada(s)`);
  if (d.cardsAdded) parts.push(`+${d.cardsAdded} card(s)`);
  if (d.cardsRemoved) parts.push(`−${d.cardsRemoved} card(s)`);
  if (d.cardsChanged) parts.push(`~${d.cardsChanged} card(s) atualizado(s)`);
  if (!parts.length) return "Quadro igual ao da VPS (sem mudanças estruturais nos cards/colunas).";
  return parts.join(", ") + ".";
}

/** Compara quadro local com o remoto (null = VPS sem board). */
export function wishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1(params: {
  localBoard: WishKanbanBoard;
  remoteBoard: WishKanbanBoard | null;
}): WishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1 {
  const local = params.localBoard;
  const remote = params.remoteBoard;

  if (!remote) {
    const cardsAdded = Object.keys(local.cardsById).length;
    const columnsAdded = local.columnOrder.length;
    const base = {
      remoteBoardMissing: true,
      boardTitleChanged: false,
      columnsAdded,
      columnsRemoved: 0,
      columnsRenamedOrReordered: 0,
      cardsAdded,
      cardsRemoved: 0,
      cardsChanged: 0,
    };
    return { ...base, summaryPtBr: buildSummaryPtBr(base) };
  }

  const boardTitleChanged = local.title.trim() !== remote.title.trim();

  const localColIds = new Set(local.columnOrder);
  const remoteColIds = new Set(remote.columnOrder);
  let columnsAdded = 0;
  let columnsRemoved = 0;
  let columnsRenamedOrReordered = 0;

  for (const id of localColIds) {
    if (!remoteColIds.has(id)) columnsAdded += 1;
  }
  for (const id of remoteColIds) {
    if (!localColIds.has(id)) columnsRemoved += 1;
  }

  const orderChanged =
    local.columnOrder.length === remote.columnOrder.length &&
    local.columnOrder.some((id, i) => remote.columnOrder[i] !== id);
  if (orderChanged) columnsRenamedOrReordered += 1;

  for (const id of localColIds) {
    if (!remoteColIds.has(id)) continue;
    const lt = local.columnsById[id]?.title?.trim() ?? "";
    const rt = remote.columnsById[id]?.title?.trim() ?? "";
    if (lt !== rt) columnsRenamedOrReordered += 1;
  }

  const localCardIds = new Set(Object.keys(local.cardsById));
  const remoteCardIds = new Set(Object.keys(remote.cardsById));
  let cardsAdded = 0;
  let cardsRemoved = 0;
  let cardsChanged = 0;

  for (const id of localCardIds) {
    if (!remoteCardIds.has(id)) cardsAdded += 1;
  }
  for (const id of remoteCardIds) {
    if (!localCardIds.has(id)) cardsRemoved += 1;
  }
  for (const id of localCardIds) {
    if (!remoteCardIds.has(id)) continue;
    const a = local.cardsById[id]!;
    const b = remote.cardsById[id]!;
    if (cardFingerprintForPublishDiffV1(a) !== cardFingerprintForPublishDiffV1(b)) {
      cardsChanged += 1;
    }
  }

  const base = {
    remoteBoardMissing: false,
    boardTitleChanged,
    columnsAdded,
    columnsRemoved,
    columnsRenamedOrReordered,
    cardsAdded,
    cardsRemoved,
    cardsChanged,
  };
  return { ...base, summaryPtBr: buildSummaryPtBr(base) };
}
