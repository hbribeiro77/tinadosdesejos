import { describe, expect, it } from "vitest";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import { wishKanbanBoardBuildSearchResultRowDtosFromBoardAndMatchingCardIdsV1 } from "@/lib/wish-kanban-board-build-search-result-row-dtos-from-board-and-matching-card-ids-v1";

describe("wishKanbanBoardBuildSearchResultRowDtosFromBoardAndMatchingCardIdsV1", () => {
  const board: WishKanbanBoard = {
    id: "b",
    title: "t",
    columnOrder: ["c2", "c1"],
    columnsById: {
      c1: { id: "c1", title: "Backlog", cardIds: ["a", "b"] },
      c2: { id: "c2", title: "Em andamento", cardIds: ["z"] },
    },
    cardsById: {
      a: {
        id: "a",
        columnId: "c1",
        issueUrl: "https://gitlab/foo/bar/-/issues/10",
        lastError: null,
        snapshot: {
          data: {
            iid: 10,
            title: "Alpha",
            state: "opened",
            webUrl: "https://gitlab/foo/bar/-/issues/10",
            projectPath: "foo/bar",
            labels: [],
            assignees: [],
            createdAt: "",
            updatedAt: "",
          },
          fetchedAt: "",
        },
      },
      b: {
        id: "b",
        columnId: "c1",
        issueUrl: "https://gitlab/foo/bar/-/issues/11",
        lastError: null,
      },
      z: {
        id: "z",
        columnId: "c2",
        issueUrl: "https://gitlab/foo/bar/-/issues/99",
        lastError: null,
        snapshot: {
          data: {
            iid: 99,
            title: "Zulu",
            state: "closed",
            webUrl: "https://gitlab/foo/bar/-/issues/99",
            projectPath: "foo/bar",
            labels: [],
            assignees: [],
            createdAt: "",
            updatedAt: "",
          },
          fetchedAt: "",
        },
      },
    },
  };

  it("preserva ordem das colunas e dos cards dentro da coluna", () => {
    const rows = wishKanbanBoardBuildSearchResultRowDtosFromBoardAndMatchingCardIdsV1(
      board,
      new Set(["z", "a", "b"]),
    );

    expect(rows.map((r) => r.cardId)).toEqual(["z", "a", "b"]);
    expect(rows[0]?.columnTitle).toBe("Em andamento");
    expect(rows[1]?.columnTitle).toBe("Backlog");
  });

  it("monta título a partir do snapshot ou da URL", () => {
    const rows = wishKanbanBoardBuildSearchResultRowDtosFromBoardAndMatchingCardIdsV1(
      board,
      new Set(["a", "b"]),
    );

    expect(rows.find((r) => r.cardId === "a")?.title).toBe("Alpha");
    expect(rows.find((r) => r.cardId === "b")?.title).toBe("https://gitlab/foo/bar/-/issues/11");
    expect(rows.find((r) => r.cardId === "a")?.iid).toBe(10);
    expect(rows.find((r) => r.cardId === "b")?.iid).toBeNull();
  });

  it("retorna lista vazia quando não há matches", () => {
    expect(
      wishKanbanBoardBuildSearchResultRowDtosFromBoardAndMatchingCardIdsV1(board, new Set()),
    ).toEqual([]);
  });
});
