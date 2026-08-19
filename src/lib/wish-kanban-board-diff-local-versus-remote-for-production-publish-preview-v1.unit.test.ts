import { describe, expect, it } from "vitest";
import { wishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1 } from "@/lib/wish-kanban-board-diff-local-versus-remote-for-production-publish-preview-v1";
import { createEmptyWishKanbanBoard } from "@/lib/wish-board-localstorage-serialization";

describe("wishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1", () => {
  it("detecta remoto ausente e cards/colunas adicionados", () => {
    const local = createEmptyWishKanbanBoard();
    const colId = local.columnOrder[0]!;
    const cardId = crypto.randomUUID();
    local.cardsById[cardId] = {
      id: cardId,
      columnId: colId,
      issueUrl: "https://gitlab.example/p/-/issues/1",
      lastError: null,
      snapshot: {
        fetchedAt: "2026-01-01T00:00:00.000Z",
        data: {
          iid: 1,
          title: "A",
          state: "opened",
          webUrl: "https://gitlab.example/p/-/issues/1",
          projectPath: "p",
          labels: [],
          assignees: [],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    };
    local.columnsById[colId]!.cardIds = [cardId];

    const diffEmpty = wishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1({
      localBoard: local,
      remoteBoard: null,
    });
    expect(diffEmpty.remoteBoardMissing).toBe(true);
    expect(diffEmpty.cardsAdded).toBe(1);

    const remote = createEmptyWishKanbanBoard();
    remote.id = local.id;
    remote.title = local.title;
    remote.columnOrder = [...local.columnOrder];
    remote.columnsById = {
      [colId]: { id: colId, title: local.columnsById[colId]!.title, cardIds: [] },
    };
    remote.cardsById = {};

    const diff = wishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1({
      localBoard: local,
      remoteBoard: remote,
    });
    expect(diff.remoteBoardMissing).toBe(false);
    expect(diff.cardsAdded).toBe(1);
    expect(diff.cardsRemoved).toBe(0);
    expect(diff.summaryPtBr).toContain("card");
  });

  it("detecta card alterado pelo fetchedAt do snapshot", () => {
    const local = createEmptyWishKanbanBoard();
    const remote = createEmptyWishKanbanBoard();
    const colId = local.columnOrder[0]!;
    const cardId = crypto.randomUUID();
    const baseCard = {
      id: cardId,
      columnId: colId,
      issueUrl: "https://gitlab.example/p/-/issues/2",
      lastError: null as string | null,
      snapshot: {
        fetchedAt: "2026-01-01T00:00:00.000Z",
        data: {
          iid: 2,
          title: "B",
          state: "opened",
          webUrl: "https://gitlab.example/p/-/issues/2",
          projectPath: "p",
          labels: [],
          assignees: [],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    };
    local.columnsById[colId]!.cardIds = [cardId];
    remote.columnsById = {
      [colId]: { id: colId, title: local.columnsById[colId]!.title, cardIds: [cardId] },
    };
    remote.columnOrder = [colId];
    remote.cardsById[cardId] = { ...baseCard, snapshot: { ...baseCard.snapshot } };
    local.cardsById[cardId] = {
      ...baseCard,
      snapshot: { ...baseCard.snapshot, fetchedAt: "2026-02-01T00:00:00.000Z" },
    };

    const diff = wishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1({
      localBoard: local,
      remoteBoard: remote,
    });
    expect(diff.cardsChanged).toBe(1);
  });
});
