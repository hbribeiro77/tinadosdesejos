import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";

/** Texto pesquisável por card (snapshot + URL). */
export function wishKanbanBoardSearchHaystackForCardFromBoard(
  board: WishKanbanBoard,
  cardId: string,
): string {
  const card = board.cardsById[cardId];
  if (!card) return "";
  const parts: string[] = [card.issueUrl];
  const d = card.snapshot?.data;
  if (d) {
    parts.push(
      d.title,
      String(d.iid),
      d.state,
      d.projectPath,
      d.webUrl,
      d.createdAt,
      d.updatedAt,
      ...d.labels.map((l) => l.name),
      ...d.assignees.flatMap((a) => [a.name, a.username]),
    );
    if (d.smartTaskDescriptionMarkdown) parts.push(d.smartTaskDescriptionMarkdown);
    if (d.smartTaskSearchHaystack) parts.push(d.smartTaskSearchHaystack);
    if (d.gitlabDescriptionMarkdown) parts.push(d.gitlabDescriptionMarkdown);
  }
  return parts.filter(Boolean).join(" ");
}

/**
 * Conjunto de cards que batem com a query (substring, sem acento opcional — aqui só lowercase).
 * `null` se a query estiver vazia → sem filtro visual.
 */
export function wishKanbanBoardComputeMatchingCardIdsForSearchQueryString(
  board: WishKanbanBoard,
  rawQuery: string,
): Set<string> | null {
  const q = typeof rawQuery === "string" ? rawQuery.trim().toLowerCase() : "";
  if (!q) return null;

  const out = new Set<string>();
  for (const cardId of Object.keys(board.cardsById)) {
    const hay = wishKanbanBoardSearchHaystackForCardFromBoard(board, cardId).toLowerCase();
    if (hay.includes(q)) out.add(cardId);
  }
  return out;
}
