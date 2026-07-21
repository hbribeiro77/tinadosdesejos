import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";

export type WishKanbanBoardSearchAutocompleteLabelGroupId = "triagem" | "outras";

export type WishKanbanBoardSearchAutocompleteLabelGroup = {
  id: WishKanbanBoardSearchAutocompleteLabelGroupId;
  /** Título curto exibido acima das pills (ex.: Triagem). */
  sectionTitle: string;
  labels: string[];
};

/** Labels “de fluxo” em caixa alta (inclui espaços), ou que mencionam triagem. */
export function wishKanbanBoardLabelNameLooksLikeTriageOrWorkflowStyle(name: string): boolean {
  const t = name.trim();
  if (!t) return false;
  if (/\btriagem\b/i.test(t)) return true;
  if (t !== t.toUpperCase()) return false;
  if (!/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(t)) return false;
  return /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9_\s–\-]+$/.test(t);
}

function uniqueSortedLabels(names: Iterable<string>): string[] {
  const trimmed = [...names].map((s) => s.trim()).filter((s): s is string => s.length > 0);
  return [...new Set(trimmed)].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
}

/**
 * Coleta nomes de label únicos dos snapshots das issues no quadro e agrupa para o autocomplete.
 */
export function wishKanbanBoardBuildSearchAutocompleteLabelSuggestionsGroupedFromBoardSnapshots(
  board: WishKanbanBoard,
): WishKanbanBoardSearchAutocompleteLabelGroup[] {
  const all = uniqueSortedLabels(
    Object.values(board.cardsById).flatMap((c) =>
      c.snapshot?.data?.labels?.map((l) => l.name) ?? [],
    ),
  );

  const triagem: string[] = [];
  const outras: string[] = [];
  for (const name of all) {
    if (wishKanbanBoardLabelNameLooksLikeTriageOrWorkflowStyle(name)) triagem.push(name);
    else outras.push(name);
  }

  const groups: WishKanbanBoardSearchAutocompleteLabelGroup[] = [];
  if (triagem.length > 0) {
    groups.push({ id: "triagem", sectionTitle: "Triagem", labels: triagem });
  }
  if (outras.length > 0) {
    groups.push({ id: "outras", sectionTitle: "Outras labels", labels: outras });
  }
  return groups;
}

export function wishKanbanBoardFilterAutocompleteLabelGroupsBySearchPrefix(
  groups: WishKanbanBoardSearchAutocompleteLabelGroup[],
  rawQuery: string,
): WishKanbanBoardSearchAutocompleteLabelGroup[] {
  const q = typeof rawQuery === "string" ? rawQuery.trim().toLowerCase() : "";
  if (!q) return groups;

  const out: WishKanbanBoardSearchAutocompleteLabelGroup[] = [];
  for (const g of groups) {
    const labels = g.labels.filter((name) => name.toLowerCase().includes(q));
    if (labels.length > 0) out.push({ ...g, labels });
  }
  return out;
}
