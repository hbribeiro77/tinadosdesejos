import type { GitLabIssueResolveResponse } from "@/lib/gitlab-issue-summary-dto-types";

export async function clientFetchGitLabIssueResolve(issueUrl: string): Promise<GitLabIssueResolveResponse> {
  const response = await fetch("/api/gitlab/issues/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ issueUrl }),
  });

  const jsonBody = (await response.json()) as GitLabIssueResolveResponse;
  return jsonBody;
}
