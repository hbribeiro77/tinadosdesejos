import { describe, expect, it } from "vitest";
import {
  gitlabApiV4ProjectUploadAssetFetchUrlFromUploadPathnameV1,
  readGitlabProjectPathFromIssueWebUrlV1,
  resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1,
} from "@/lib/resolve-gitlab-markdown-upload-asset-target-to-server-fetch-url-v1";

const base = "https://gitlab.defpub.local";
const projectPath = "portal-da-defensoria/portal-defensoria-gateway";
const webUrl = `${base}/${projectPath}/-/work_items/3549`;
const uploadTarget = "/uploads/50eb0f8fdc20d1725b64ef9aa1753185/image.png";

describe("readGitlabProjectPathFromIssueWebUrlV1", () => {
  it("extrai projectPath de work_items", () => {
    expect(readGitlabProjectPathFromIssueWebUrlV1(webUrl)).toBe(projectPath);
  });
});

describe("resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1", () => {
  it("resolve upload da issue 3549 para API v4 do projeto", () => {
    expect(
      resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1(uploadTarget, {
        gitlabBaseUrl: base,
        gitlabIssueWebUrl: webUrl,
      }),
    ).toBe(
      `${base}/api/v4/projects/${encodeURIComponent(projectPath)}/uploads/50eb0f8fdc20d1725b64ef9aa1753185/image.png`,
    );
  });

  it("monta URL API a partir do pathname", () => {
    expect(
      gitlabApiV4ProjectUploadAssetFetchUrlFromUploadPathnameV1(uploadTarget, {
        gitlabBaseUrl: base,
        gitlabProjectPath: projectPath,
      }),
    ).toContain("/api/v4/projects/");
  });
});
