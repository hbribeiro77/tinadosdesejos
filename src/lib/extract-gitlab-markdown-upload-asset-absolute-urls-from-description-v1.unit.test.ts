import { describe, expect, it } from "vitest";
import {
  extractGitlabMarkdownUploadAssetAbsoluteUrlsFromDescriptionV1,
  extractGitlabMarkdownUploadAssetServerFetchUrlsFromDescriptionV1,
} from "@/lib/extract-gitlab-markdown-upload-asset-absolute-urls-from-description-v1";

describe("extractGitlabMarkdownUploadAssetServerFetchUrlsFromDescriptionV1", () => {
  const webUrl = "https://gitlab.example.com/group/proj/-/issues/42";
  const baseUrl = "https://gitlab.example.com";
  const projectPath = "group/proj";

  it("usa API v4 quando gitlabBaseUrl e projectPath estão disponíveis", () => {
    const md = "![a](/uploads/abc/image.png)";
    expect(
      extractGitlabMarkdownUploadAssetServerFetchUrlsFromDescriptionV1(md, {
        gitlabIssueWebUrl: webUrl,
        gitlabBaseUrl: baseUrl,
        gitlabProjectPath: projectPath,
      }),
    ).toEqual([`${baseUrl}/api/v4/projects/${encodeURIComponent(projectPath)}/uploads/abc/image.png`]);
  });

  it("fallback legado sem baseUrl", () => {
    const md = "![a](/uploads/abc/image.png)";
    expect(extractGitlabMarkdownUploadAssetAbsoluteUrlsFromDescriptionV1(md, { gitlabIssueWebUrl: webUrl })).toEqual([
      "https://gitlab.example.com/uploads/abc/image.png",
    ]);
  });

  it("extrai img HTML via API v4", () => {
    const md = '<p>x</p><img alt="s" src="/uploads/foo/bar.png" />';
    expect(
      extractGitlabMarkdownUploadAssetServerFetchUrlsFromDescriptionV1(md, {
        gitlabIssueWebUrl: webUrl,
        gitlabBaseUrl: baseUrl,
        gitlabProjectPath: projectPath,
      }),
    ).toEqual([`${baseUrl}/api/v4/projects/${encodeURIComponent(projectPath)}/uploads/foo/bar.png`]);
  });
});
