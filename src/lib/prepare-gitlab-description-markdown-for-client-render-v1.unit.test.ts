import { describe, expect, it } from "vitest";
import { prepareGitlabDescriptionMarkdownForClientRenderV1 } from "@/lib/prepare-gitlab-description-markdown-for-client-render-v1";

describe("prepareGitlabDescriptionMarkdownForClientRenderV1", () => {
  const webUrl = "https://gitlab.example.com/g/p/-/issues/1";

  it("delega para pipeline da Tina (URLs locais + proxy wish-kanban)", () => {
    const md = [
      "![local](/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png)",
      "![gitlab](/uploads/a/b.png)",
    ].join("\n");
    const out = prepareGitlabDescriptionMarkdownForClientRenderV1(md, {
      gitlabIssueWebUrl: webUrl,
    });
    expect(out).toContain("/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/");
    expect(out).toContain("/api/wish-kanban-board/description-image-proxy-v1?url=");
  });

  it("reescreve /uploads/ quando não há URL local", () => {
    const md = "![x](/uploads/a/b.png)";
    const out = prepareGitlabDescriptionMarkdownForClientRenderV1(md, { gitlabIssueWebUrl: webUrl });
    expect(out).toContain("/api/wish-kanban-board/description-image-proxy-v1?url=");
  });
});
