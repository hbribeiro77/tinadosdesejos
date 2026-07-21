import { describe, expect, it } from "vitest";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import { wishGitlabIssueSummaryDescriptionMarkdownFromSnapshotDataV1 } from "@/lib/wish-gitlab-issue-summary-description-markdown-from-snapshot-data-v1";

describe("wishGitlabIssueSummaryDescriptionMarkdownFromSnapshotDataV1", () => {
  const base = (extra: Partial<GitLabIssueSummaryDto> = {}): GitLabIssueSummaryDto => ({
    iid: 1,
    title: "t",
    state: "opened",
    webUrl: "https://gitlab.example.com/a/b/-/issues/1",
    projectPath: "a/b",
    labels: [],
    assignees: [],
    createdAt: "",
    updatedAt: "",
    ...extra,
  });

  it("prioriza gitlabDescriptionMarkdown", () => {
    expect(
      wishGitlabIssueSummaryDescriptionMarkdownFromSnapshotDataV1(
        base({
          gitlabDescriptionMarkdown: " do GitLab ",
          smartTaskDescriptionMarkdown: " do SmartTask ",
        }),
      ),
    ).toBe("do GitLab");
  });

  it("usa smartTaskDescriptionMarkdown como fallback", () => {
    expect(
      wishGitlabIssueSummaryDescriptionMarkdownFromSnapshotDataV1(
        base({ smartTaskDescriptionMarkdown: " notas " }),
      ),
    ).toBe("notas");
  });

  it("retorna null sem descrição", () => {
    expect(wishGitlabIssueSummaryDescriptionMarkdownFromSnapshotDataV1(base())).toBeNull();
  });
});
