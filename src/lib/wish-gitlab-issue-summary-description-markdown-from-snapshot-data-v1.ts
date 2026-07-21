import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";

/** Descrição Markdown para exibição: GitLab tem prioridade; SmartTask como fallback. */
export function wishGitlabIssueSummaryDescriptionMarkdownFromSnapshotDataV1(
  data: GitLabIssueSummaryDto | null | undefined,
): string | null {
  if (!data) return null;

  const gitlab = typeof data.gitlabDescriptionMarkdown === "string" ? data.gitlabDescriptionMarkdown.trim() : "";
  if (gitlab) return gitlab;

  const smart =
    typeof data.smartTaskDescriptionMarkdown === "string" ? data.smartTaskDescriptionMarkdown.trim() : "";
  if (smart) return smart;

  return null;
}
