import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";

export type GitLabApplyDvituScoringToGitlabIssueSuccessDto = {
  ok: true;
  data: GitLabIssueSummaryDto;
};

export type GitLabApplyDvituScoringToGitlabIssueFailureDto = {
  ok: false;
  code: string;
  message: string;
};

export type GitLabApplyDvituScoringToGitlabIssueResponseDto =
  | GitLabApplyDvituScoringToGitlabIssueSuccessDto
  | GitLabApplyDvituScoringToGitlabIssueFailureDto;
