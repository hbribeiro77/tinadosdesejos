import { describe, expect, it } from "vitest";
import { createEmptyWishKanbanBoard } from "@/lib/wish-board-localstorage-serialization";
import { wishKanbanBoardCollectMirroredDescriptionUploadedAssetFileNamesFromBoardMarkdownV1 } from "@/lib/wish-kanban-board-collect-mirrored-description-uploaded-asset-file-names-from-board-markdown-v1";

describe("wishKanbanBoardCollectMirroredDescriptionUploadedAssetFileNamesFromBoardMarkdownV1", () => {
  it("coleta fileNames únicos das URLs locais no markdown", () => {
    const board = createEmptyWishKanbanBoard();
    const colId = board.columnOrder[0]!;
    const cardId = crypto.randomUUID();
    const hashA = "a".repeat(64);
    const hashB = "b".repeat(64);
    board.cardsById[cardId] = {
      id: cardId,
      columnId: colId,
      issueUrl: "https://gitlab.example/p/-/issues/1",
      lastError: null,
      snapshot: {
        fetchedAt: new Date().toISOString(),
        data: {
          iid: 1,
          title: "t",
          state: "opened",
          webUrl: "https://gitlab.example/p/-/issues/1",
          projectPath: "p",
          labels: [],
          assignees: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          gitlabDescriptionMarkdown: [
            `![a](/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/${hashA}.png)`,
            `![b](/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/${hashB}.jpg)`,
            `![a2](/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/${hashA}.png)`,
          ].join("\n"),
        },
      },
    };
    board.columnsById[colId]!.cardIds = [cardId];

    const names = wishKanbanBoardCollectMirroredDescriptionUploadedAssetFileNamesFromBoardMarkdownV1(board);
    expect(names).toEqual([`${hashA}.png`, `${hashB}.jpg`]);
  });
});
