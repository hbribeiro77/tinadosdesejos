import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";

export const WISH_GITLAB_TRIAGE_DND_KIND = "wishGitlabTriageIssueFromDrawer" as const;

export type WishGitlabTriageDrawerDnDPayload = {
  kind: typeof WISH_GITLAB_TRIAGE_DND_KIND;
  issueUrl: string;
  preview: GitLabIssueSummaryDto;
};

export function wishGitlabTriageDrawerDnDActiveId(preview: GitLabIssueSummaryDto) {
  if (preview.gitlabIssueId != null) {
    return `wish-triage-gitlab-id:${preview.gitlabIssueId}`;
  }
  return `wish-triage-web-url:${encodeURIComponent(preview.webUrl)}`;
}
