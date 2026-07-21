/**
 * Rola o quadro até a coluna/card e aplica um pulso visual temporário no card.
 * Só deve ser chamado no browser (após expandir coluna, se necessário).
 */
export function wishKanbanBoardFocusCardInDomScrollColumnAndCardWithPulseHighlightV1(
  cardId: string,
  columnId: string,
): void {
  if (typeof document === "undefined") return;

  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = reducedMotion ? ("instant" as const) : ("smooth" as const);
  const followUpDelayMs = reducedMotion ? 0 : 280;

  const columnEl = document.querySelector(
    `[data-wish-kanban-column-id="${CSS.escape(columnId)}"]`,
  );
  columnEl?.scrollIntoView({ behavior, block: "nearest", inline: "center" });

  window.setTimeout(() => {
    const cardEl = document.querySelector(`[data-wish-kanban-card-id="${CSS.escape(cardId)}"]`);
    cardEl?.scrollIntoView({ behavior, block: "center", inline: "nearest" });

    if (!(cardEl instanceof HTMLElement)) return;

    cardEl.classList.add("wish-kanban-board-search-result-card-focus-pulse");
    window.setTimeout(() => {
      cardEl.classList.remove("wish-kanban-board-search-result-card-focus-pulse");
    }, 2200);
  }, followUpDelayMs);
}
