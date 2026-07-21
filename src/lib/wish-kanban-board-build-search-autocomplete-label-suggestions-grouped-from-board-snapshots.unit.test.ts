import { describe, expect, it } from "vitest";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import {
  wishKanbanBoardBuildSearchAutocompleteLabelSuggestionsGroupedFromBoardSnapshots,
  wishKanbanBoardFilterAutocompleteLabelGroupsBySearchPrefix,
  wishKanbanBoardLabelNameLooksLikeTriageOrWorkflowStyle,
} from "@/lib/wish-kanban-board-build-search-autocomplete-label-suggestions-grouped-from-board-snapshots";

describe("wishKanbanBoardLabelNameLooksLikeTriageOrWorkflowStyle", () => {
  it("classifica labels em caixa alta de fluxo", () => {
    expect(wishKanbanBoardLabelNameLooksLikeTriageOrWorkflowStyle("ANALISAR")).toBe(true);
    expect(wishKanbanBoardLabelNameLooksLikeTriageOrWorkflowStyle("COM TRIAGEM IA")).toBe(true);
    expect(wishKanbanBoardLabelNameLooksLikeTriageOrWorkflowStyle("SEM TRIAGEM")).toBe(true);
  });

  it("aceita menção a triagem em qualquer caixa", () => {
    expect(wishKanbanBoardLabelNameLooksLikeTriageOrWorkflowStyle("Triagem de issues")).toBe(true);
  });

  it("mantém labels mistas no grupo outras", () => {
    expect(wishKanbanBoardLabelNameLooksLikeTriageOrWorkflowStyle("bug")).toBe(false);
    expect(wishKanbanBoardLabelNameLooksLikeTriageOrWorkflowStyle("Melhoria")).toBe(false);
  });
});

describe("wishKanbanBoardBuildSearchAutocompleteLabelSuggestionsGroupedFromBoardSnapshots", () => {
  const board: WishKanbanBoard = {
    id: "b",
    title: "t",
    columnOrder: ["c1"],
    columnsById: { c1: { id: "c1", title: "A", cardIds: ["x", "y"] } },
    cardsById: {
      x: {
        id: "x",
        columnId: "c1",
        issueUrl: "https://gitlab/foo/bar/-/issues/1",
        lastError: null,
        snapshot: {
          data: {
            iid: 1,
            title: "A",
            state: "opened",
            webUrl: "https://gitlab/foo/bar/-/issues/1",
            projectPath: "foo/bar",
            labels: [
              { name: "ANALISAR", color: null },
              { name: "bug", color: null },
            ],
            assignees: [],
            createdAt: "",
            updatedAt: "",
          },
          fetchedAt: "",
        },
      },
      y: {
        id: "y",
        columnId: "c1",
        issueUrl: "https://gitlab/foo/bar/-/issues/2",
        lastError: null,
        snapshot: {
          data: {
            iid: 2,
            title: "B",
            state: "opened",
            webUrl: "https://gitlab/foo/bar/-/issues/2",
            projectPath: "foo/bar",
            labels: [{ name: "bug", color: null }],
            assignees: [],
            createdAt: "",
            updatedAt: "",
          },
          fetchedAt: "",
        },
      },
    },
  };

  it("agrupa ANALISAR em Triagem e bug em Outras labels", () => {
    const g = wishKanbanBoardBuildSearchAutocompleteLabelSuggestionsGroupedFromBoardSnapshots(board);
    const tri = g.find((x) => x.id === "triagem");
    const out = g.find((x) => x.id === "outras");
    expect(tri?.labels).toEqual(["ANALISAR"]);
    expect(out?.labels).toEqual(["bug"]);
  });
});

describe("wishKanbanBoardFilterAutocompleteLabelGroupsBySearchPrefix", () => {
  it("filtra por substring na query", () => {
    const groups = wishKanbanBoardBuildSearchAutocompleteLabelSuggestionsGroupedFromBoardSnapshots({
      id: "b",
      title: "t",
      columnOrder: ["c1"],
      columnsById: { c1: { id: "c1", title: "A", cardIds: ["x"] } },
      cardsById: {
        x: {
          id: "x",
          columnId: "c1",
          issueUrl: "u",
          snapshot: {
            data: {
              iid: 1,
              title: "",
              state: "opened",
              webUrl: "",
              projectPath: "",
              labels: [
                { name: "ALPHA_ONE", color: null },
                { name: "beta", color: null },
              ],
              assignees: [],
              createdAt: "",
              updatedAt: "",
            },
            fetchedAt: "",
          },
        },
      },
    });
    const filtered = wishKanbanBoardFilterAutocompleteLabelGroupsBySearchPrefix(groups, "alp");
    expect(filtered.some((g) => g.labels.includes("ALPHA_ONE"))).toBe(true);
    expect(filtered.every((g) => !g.labels.includes("beta"))).toBe(true);
  });
});
