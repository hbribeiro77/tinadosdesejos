import { describe, expect, it } from "vitest";
import { gitlabMarkdownUploadAssetAbsoluteUrlIsAllowedForServerProxyV1 } from "@/lib/gitlab-markdown-upload-asset-url-is-allowed-for-server-proxy-v1";
import { rewriteGitlabMarkdownDescriptionImageUrlsForTinaProxyRenderV1 } from "@/lib/rewrite-gitlab-markdown-description-image-urls-for-tina-proxy-render-v1";

describe("gitlabMarkdownUploadAssetAbsoluteUrlIsAllowedForServerProxyV1", () => {
  const base = "https://gitlab.example.com";

  it("aceita uploads no mesmo host do GitLab configurado", () => {
    expect(
      gitlabMarkdownUploadAssetAbsoluteUrlIsAllowedForServerProxyV1(
        "https://gitlab.example.com/foo/bar/uploads/abc/image.png",
        base,
      ),
    ).toBe(true);
  });

  it("rejeita host diferente ou caminho sem uploads", () => {
    expect(
      gitlabMarkdownUploadAssetAbsoluteUrlIsAllowedForServerProxyV1(
        "https://evil.example.com/uploads/x.png",
        base,
      ),
    ).toBe(false);
    expect(
      gitlabMarkdownUploadAssetAbsoluteUrlIsAllowedForServerProxyV1(
        "https://gitlab.example.com/foo/bar/-/issues/1",
        base,
      ),
    ).toBe(false);
  });
});

describe("rewriteGitlabMarkdownDescriptionImageUrlsForTinaProxyRenderV1", () => {
  it("reescreve imagem relativa e absoluta de uploads para o proxy", () => {
    const md = [
      "Texto",
      "![shot](/uploads/abc/image.png)",
      '![abs](https://gitlab.example.com/group/proj/uploads/xyz/pic.jpg)',
    ].join("\n");

    const out = rewriteGitlabMarkdownDescriptionImageUrlsForTinaProxyRenderV1(md, {
      gitlabIssueWebUrl: "https://gitlab.example.com/group/proj/-/issues/42",
    });

    expect(out).toContain(
      "![shot](/api/gitlab/markdown-upload-asset-proxy-v1?url=" +
        encodeURIComponent("https://gitlab.example.com/uploads/abc/image.png") +
        ")",
    );
    expect(out).toContain(
      "![abs](/api/gitlab/markdown-upload-asset-proxy-v1?url=" +
        encodeURIComponent("https://gitlab.example.com/group/proj/uploads/xyz/pic.jpg") +
        ")",
    );
  });

  it("não altera links que não são upload", () => {
    const md = "[doc](https://gitlab.example.com/group/proj/-/issues/1)";
    expect(
      rewriteGitlabMarkdownDescriptionImageUrlsForTinaProxyRenderV1(md, {
        gitlabIssueWebUrl: "https://gitlab.example.com/group/proj/-/issues/1",
      }),
    ).toBe(md);
  });
});
