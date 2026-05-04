import { describe, expect, it } from "vitest";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import { wishKanbanBoardComputeMatchingCardIdsForSearchQueryString } from "@/lib/wish-kanban-board-compute-matching-card-ids-for-search-query-string";

describe("wishKanbanBoardComputeMatchingCardIdsForSearchQueryString", () => {
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
            title: "Alpha login",
            state: "opened",
            webUrl: "https://gitlab/foo/bar/-/issues/1",
            projectPath: "foo/bar",
            labels: [{ name: "bug", color: null }],
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
            title: "Beta deploy",
            state: "opened",
            webUrl: "https://gitlab/foo/bar/-/issues/2",
            projectPath: "foo/bar",
            labels: [{ name: "feature", color: null }],
            assignees: [],
            createdAt: "",
            updatedAt: "",
          },
          fetchedAt: "",
        },
      },
    },
  };

  it("retorna null para query vazia", () => {
    expect(wishKanbanBoardComputeMatchingCardIdsForSearchQueryString(board, "")).toBeNull();
    expect(wishKanbanBoardComputeMatchingCardIdsForSearchQueryString(board, "   ")).toBeNull();
  });

  it("encontra por título e por label", () => {
    const m1 = wishKanbanBoardComputeMatchingCardIdsForSearchQueryString(board, "alpha");
    expect(m1?.has("x")).toBe(true);
    expect(m1?.has("y")).toBe(false);

    const m2 = wishKanbanBoardComputeMatchingCardIdsForSearchQueryString(board, "feature");
    expect(m2?.has("y")).toBe(true);
    expect(m2?.has("x")).toBe(false);
  });
});
