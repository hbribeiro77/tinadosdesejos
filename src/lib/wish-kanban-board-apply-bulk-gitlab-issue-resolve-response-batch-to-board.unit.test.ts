import { describe, expect, it } from "vitest";
import { wishKanbanBoardApplyBulkGitlabIssueResolveResponseBatchToBoard } from "@/lib/wish-kanban-board-apply-bulk-gitlab-issue-resolve-response-batch-to-board";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";

describe("wishKanbanBoardApplyBulkGitlabIssueResolveResponseBatchToBoard", () => {
  it("aplica snapshot em lote e erro por card", () => {
    const board: WishKanbanBoard = {
      id: "b1",
      title: "T",
      columnOrder: ["c1"],
      columnsById: {
        c1: { id: "c1", title: "Col", cardIds: ["a", "b"] },
      },
      cardsById: {
        a: { id: "a", columnId: "c1", issueUrl: "https://x/a/-/issues/1", lastError: null },
        b: { id: "b", columnId: "c1", issueUrl: "https://x/a/-/issues/2", lastError: null },
      },
    };

    const next = wishKanbanBoardApplyBulkGitlabIssueResolveResponseBatchToBoard(board, [
      {
        cardIds: ["a"],
        res: {
          ok: true,
          data: {
            iid: 1,
            title: "Ok",
            state: "opened",
            webUrl: "https://x/a/-/issues/1",
            projectPath: "a",
            labels: [],
            assignees: [],
            updatedAt: "2026-01-01T00:00:00Z",
          },
        },
      },
      {
        cardIds: ["b"],
        res: { ok: false, code: "x", message: "falhou" },
      },
    ]);

    expect(next.cardsById.a?.snapshot?.data.title).toBe("Ok");
    expect(next.cardsById.b?.lastError).toBe("falhou");
  });
});
