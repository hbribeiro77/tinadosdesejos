import type { GitLabTriageGroupIssuesListResponse } from "@/lib/gitlab-triage-group-issues-list-response-types";

export async function clientFetchGitLabTriageGroupIssuesPage(input: {
  page: number;
  perPage?: number;
  /** CSV de labels (AND no GitLab). Omitir usa fallback do servidor (`GITLAB_TRIAGE_LABEL`). */
  labelsCsv?: string;
}): Promise<GitLabTriageGroupIssuesListResponse> {
  const payload: Record<string, unknown> = {
    page: input.page,
    perPage: input.perPage ?? 30,
  };
  if (typeof input.labelsCsv === "string" && input.labelsCsv.trim()) {
    payload.labelsCsv = input.labelsCsv.trim();
  }

  const response = await fetch("/api/gitlab/issues/triage-group-list", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as GitLabTriageGroupIssuesListResponse;
}
