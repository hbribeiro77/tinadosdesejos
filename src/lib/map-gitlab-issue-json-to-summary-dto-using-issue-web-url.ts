import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import { mapGitLabRestIssueJsonToSummaryDto } from "@/lib/map-gitlab-rest-issue-json-to-summary-dto";
import { GitLabIssueUrlParseError, parseGitLabIssueUrl } from "@/lib/parse-gitlab-issue-url";

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function mapGitLabIssueJsonToSummaryDtoUsingIssueWebUrl(
  issue: Record<string, unknown>,
): GitLabIssueSummaryDto | null {
  const webUrl = readString(issue.web_url);
  if (!webUrl) return null;

  try {
    const parsed = parseGitLabIssueUrl(webUrl);
    return mapGitLabRestIssueJsonToSummaryDto(issue, parsed.projectPath);
  } catch (cause) {
    if (cause instanceof GitLabIssueUrlParseError) return null;
    return null;
  }
}
