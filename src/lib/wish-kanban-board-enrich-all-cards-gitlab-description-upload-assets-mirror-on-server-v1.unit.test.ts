import { describe, expect, it } from "vitest";
import { wishKanbanBoardCardGitlabDescriptionMarkdownNeedsUploadAssetMirrorV1 } from "@/lib/wish-kanban-board-enrich-all-cards-gitlab-description-upload-assets-mirror-on-server-v1";

describe("wishKanbanBoardCardGitlabDescriptionMarkdownNeedsUploadAssetMirrorV1", () => {
  it("detecta referências /uploads/", () => {
    expect(wishKanbanBoardCardGitlabDescriptionMarkdownNeedsUploadAssetMirrorV1("![x](/uploads/a.png)")).toBe(
      true,
    );
    expect(
      wishKanbanBoardCardGitlabDescriptionMarkdownNeedsUploadAssetMirrorV1(
        "![local](/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/abc.png)",
      ),
    ).toBe(false);
  });
});
