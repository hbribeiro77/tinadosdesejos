import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag")
  >();
  return {
    ...actual,
    gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag: vi.fn(),
  };
});

import { gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag } from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";
import { mirrorGitlabIssueDescriptionUploadAssetsToLocalDataDirectoryAndRewriteMarkdownOnServerV1 } from "@/lib/mirror-gitlab-issue-description-upload-assets-to-local-data-directory-and-rewrite-markdown-on-server-v1";

const issue3549 = {
  baseUrl: "https://gitlab.defpub.local",
  projectPath: "portal-da-defensoria/portal-defensoria-gateway",
  webUrl:
    "https://gitlab.defpub.local/portal-da-defensoria/portal-defensoria-gateway/-/work_items/3549",
  markdown:
    "![image.png](/uploads/50eb0f8fdc20d1725b64ef9aa1753185/image.png){width=900 height=543}",
  apiFetchUrl:
    "https://gitlab.defpub.local/api/v4/projects/portal-da-defensoria%2Fportal-defensoria-gateway/uploads/50eb0f8fdc20d1725b64ef9aa1753185/image.png",
};

describe("mirrorGitlabIssueDescriptionUploadAssetsToLocalDataDirectoryAndRewriteMarkdownOnServerV1", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "tina-gitlab-mirror-"));
    vi.mocked(gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag).mockResolvedValue({
      ok: true,
      status: 200,
      body: Buffer.from("fake-png-bytes"),
      contentType: "image/png",
    });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it("grava arquivo no diretório e reescreve markdown para URL local", async () => {
    const markdown = "Intro\n\n![shot](/uploads/abc/image.png)\n";
    const webUrl = "https://gitlab.example.com/group/proj/-/issues/42";

    const out = await mirrorGitlabIssueDescriptionUploadAssetsToLocalDataDirectoryAndRewriteMarkdownOnServerV1(
      markdown,
      {
        gitlabIssueWebUrl: webUrl,
        gitlabProjectPath: "group/proj",
        gitlabBaseUrl: "https://gitlab.example.com",
        token: "test-token",
        tlsInsecureDev: false,
        dataDirectoryAbsolutePath: tmpDir,
      },
    );

    expect(out).toContain("/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/");
    expect(out).not.toContain("/uploads/abc/image.png");

    const files = await readdir(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^[a-f0-9]{64}\.png$/);

    const bytes = await readFile(path.join(tmpDir, files[0]!));
    expect(bytes.toString()).toBe("fake-png-bytes");
    expect(gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag).toHaveBeenCalledWith(
      "https://gitlab.example.com/api/v4/projects/group%2Fproj/uploads/abc/image.png",
      "test-token",
      false,
    );
  });

  it("espelha imagem real da issue 3549 via API v4 do projeto", async () => {
    const out = await mirrorGitlabIssueDescriptionUploadAssetsToLocalDataDirectoryAndRewriteMarkdownOnServerV1(
      issue3549.markdown,
      {
        gitlabIssueWebUrl: issue3549.webUrl,
        gitlabProjectPath: issue3549.projectPath,
        gitlabBaseUrl: issue3549.baseUrl,
        token: "test-token",
        tlsInsecureDev: true,
        dataDirectoryAbsolutePath: tmpDir,
      },
    );

    expect(out).toContain("/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/");
    expect(out).not.toContain("/uploads/50eb0f8fdc20d1725b64ef9aa1753185/image.png");
    expect(await readdir(tmpDir)).toHaveLength(1);
    expect(gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag).toHaveBeenCalledWith(
      issue3549.apiFetchUrl,
      "test-token",
      true,
    );
  });
});
