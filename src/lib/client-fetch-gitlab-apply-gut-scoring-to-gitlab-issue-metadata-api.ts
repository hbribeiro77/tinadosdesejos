import type { GitLabApplyGutScoringToGitlabIssueResponseDto } from "@/lib/gitlab-apply-gut-scoring-to-gitlab-issue-api-response-dto-types";

export type ClientFetchGitlabApplyGutScoringBody = {
  issueUrl: string;
  g: number;
  u: number;
  t: number;
};

export async function clientFetchGitlabApplyGutScoringToGitlabIssueMetadataApi(
  body: ClientFetchGitlabApplyGutScoringBody,
): Promise<GitLabApplyGutScoringToGitlabIssueResponseDto> {
  const res = await fetch("/api/gitlab/issues/apply-gut-scoring-and-update-gitlab-issue-metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as GitLabApplyGutScoringToGitlabIssueResponseDto;
  if (!res.ok && json && typeof json === "object" && "ok" in json && json.ok === false) {
    return json;
  }
  if (!res.ok) {
    return {
      ok: false,
      code: "http_error",
      message: `Falha HTTP ${res.status} ao aplicar GUT.`,
    };
  }
  return json;
}
