import { describe, expect, it } from "vitest";
import { stripWishKanbanCardDescriptionMarkdownImageDimensionAttributeSuffixesV1 } from "@/lib/strip-wish-kanban-card-description-markdown-image-dimension-attribute-suffixes-v1";
import { prepareWishKanbanCardDescriptionMarkdownForClientRenderV1 } from "@/lib/prepare-wish-kanban-card-description-markdown-for-client-render-v1";

const webUrl =
  "https://gitlab.defpub.local/portal-da-defensoria/portal-defensoria-gateway/-/work_items/3549";
const projectPath = "portal-da-defensoria/portal-defensoria-gateway";

describe("stripWishKanbanCardDescriptionMarkdownImageDimensionAttributeSuffixesV1", () => {
  it("remove {width height} após imagem markdown", () => {
    const md =
      '![image.png](/uploads/abc/image.png){width="900" height="529"}';
    expect(stripWishKanbanCardDescriptionMarkdownImageDimensionAttributeSuffixesV1(md)).toBe(
      "![image.png](/uploads/abc/image.png)",
    );
  });
});

describe("prepareWishKanbanCardDescriptionMarkdownForClientRenderV1", () => {
  it("remove dimensões e reescreve /uploads/ para proxy da Tina", () => {
    const md =
      '![image.png](/uploads/abc/image.png){width="900" height="529"}';
    const out = prepareWishKanbanCardDescriptionMarkdownForClientRenderV1(md, {
      issueWebUrl: webUrl,
      projectPath,
    });
    expect(out).not.toContain("{width=");
    expect(out).toContain("/api/wish-kanban-board/description-image-proxy-v1?");
    expect(out).toContain(encodeURIComponent("/uploads/abc/image.png"));
    expect(out).toContain(encodeURIComponent(projectPath));
  });

  it("preserva URLs locais já espelhadas", () => {
    const md =
      "![local](/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png)";
    expect(prepareWishKanbanCardDescriptionMarkdownForClientRenderV1(md, { issueWebUrl: webUrl })).toBe(md);
  });
});
