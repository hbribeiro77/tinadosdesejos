import { readdir, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import {
  mirrorGitlabIssueDescriptionUploadAssetsToLocalDataDirectoryAndRewriteMarkdownOnServerV1,
  wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1,
} from "@/lib/mirror-gitlab-issue-description-upload-assets-to-local-data-directory-and-rewrite-markdown-on-server-v1";

function loadEnvLocalIntoProcessEnvV1() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const envText = readFileSync(envPath, "utf8");
    for (const line of envText.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch {
    // sem .env.local
  }
}

loadEnvLocalIntoProcessEnvV1();

const baseUrl = process.env.GITLAB_BASE_URL?.replace(/\/+$/, "");
const token = process.env.GITLAB_TOKEN;
const tls = process.env.GITLAB_TLS_INSECURE_DEV === "1";

describe("wish-kanban-board mirror issue 3549 description image on disk (integração GitLab)", () => {
  it("baixa PNG da issue 3549 para data/gitlab-description-uploaded-assets-v1", async () => {
    expect(baseUrl).toBeTruthy();
    expect(token).toBeTruthy();

    const db = new Database(path.join(process.cwd(), "data", "triage.db"));
    const board = JSON.parse(
      db.prepare("SELECT payload_json FROM wish_kanban_board_persisted_v1 LIMIT 1").get().payload_json,
    ).board;

    const card = Object.values(board.cardsById).find(
      (c: { snapshot?: { data?: { iid?: number } } }) => c.snapshot?.data?.iid === 3549,
    ) as { snapshot: { data: { webUrl: string; projectPath: string; gitlabDescriptionMarkdown: string } } };

    expect(card).toBeTruthy();

    const d = card.snapshot.data;
    const dataDir = wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1();

    const rewritten = await mirrorGitlabIssueDescriptionUploadAssetsToLocalDataDirectoryAndRewriteMarkdownOnServerV1(
      d.gitlabDescriptionMarkdown,
      {
        gitlabIssueWebUrl: d.webUrl,
        gitlabProjectPath: d.projectPath,
        gitlabBaseUrl: baseUrl!,
        token: token!,
        tlsInsecureDev: tls,
        dataDirectoryAbsolutePath: dataDir,
      },
    );

    const files = await readdir(dataDir);
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(rewritten).toContain("/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/");
    expect(rewritten).not.toContain("/uploads/50eb0f8fdc20d1725b64ef9aa1753185/image.png");

    const png = await readFile(path.join(dataDir, files[0]!));
    expect(png.slice(0, 4).toString("hex")).toBe("89504e47");
  }, 60_000);
});
