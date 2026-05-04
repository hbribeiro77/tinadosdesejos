import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";

export type GitLabApplyGutScoringToGitlabIssueSuccessDto = {
  ok: true;
  data: GitLabIssueSummaryDto;
};

export type GitLabApplyGutScoringToGitlabIssueFailureDto = {
  ok: false;
  code: string;
  message: string;
};

export type GitLabApplyGutScoringToGitlabIssueResponseDto =
  | GitLabApplyGutScoringToGitlabIssueSuccessDto
  | GitLabApplyGutScoringToGitlabIssueFailureDto;
