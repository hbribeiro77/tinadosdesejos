import { describe, expect, it } from "vitest";
import { createEmptyWishKanbanBoard } from "@/lib/wish-board-localstorage-serialization";
import { wishKanbanBoardParseExportBundleJsonTextAcceptVersion1Or2WithOptionalAssetsV1 } from "@/lib/wish-kanban-board-parse-export-bundle-json-text-accept-version-1-or-2-with-optional-assets-v1";

describe("wishKanbanBoardParseExportBundleJsonTextAcceptVersion1Or2WithOptionalAssetsV1", () => {
  it("aceita v1 sem assets e v2 com assets", () => {
    const board = createEmptyWishKanbanBoard();
    const v1 = JSON.stringify({ version: 1, board });
    const parsed1 = wishKanbanBoardParseExportBundleJsonTextAcceptVersion1Or2WithOptionalAssetsV1(v1);
    expect(parsed1?.board.title).toBe(board.title);
    expect(parsed1?.descriptionUploadedAssetsBase64ByFileNameV1).toEqual({});

    const hash = `${"c".repeat(64)}.png`;
    const v2 = JSON.stringify({
      version: 2,
      board,
      descriptionUploadedAssetsBase64ByFileNameV1: { [hash]: "YWJj" },
    });
    const parsed2 = wishKanbanBoardParseExportBundleJsonTextAcceptVersion1Or2WithOptionalAssetsV1(v2);
    expect(parsed2?.descriptionUploadedAssetsBase64ByFileNameV1[hash]).toBe("YWJj");
  });
});
