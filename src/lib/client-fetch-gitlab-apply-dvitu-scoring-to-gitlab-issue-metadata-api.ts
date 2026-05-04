import type { GitLabApplyDvituScoringToGitlabIssueResponseDto } from "@/lib/gitlab-apply-dvitu-scoring-to-gitlab-issue-api-response-dto-types";

export type ClientFetchGitlabApplyDvituScoringBody = {
  issueUrl: string;
  d: number;
  v: number;
  i: number;
  t: number;
  u: number;
  explanationD?: string;
  explanationV?: string;
  explanationI?: string;
  explanationT?: string;
  explanationU?: string;
};

export async function clientFetchGitlabApplyDvituScoringToGitlabIssueMetadataApi(
  body: ClientFetchGitlabApplyDvituScoringBody,
): Promise<GitLabApplyDvituScoringToGitlabIssueResponseDto> {
  const res = await fetch("/api/gitlab/issues/apply-dvitu-scoring-and-update-gitlab-issue-metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as GitLabApplyDvituScoringToGitlabIssueResponseDto;
  if (!res.ok && json && typeof json === "object" && "ok" in json && json.ok === false) {
    return json;
  }
  if (!res.ok) {
    return {
      ok: false,
      code: "http_error",
      message: `Falha HTTP ${res.status} ao aplicar DVITU.`,
    };
  }
  return json;
}
