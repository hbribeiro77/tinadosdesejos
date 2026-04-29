import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";

export type GitLabTriageGroupIssuesListSuccess = {
  ok: true;
  issues: GitLabIssueSummaryDto[];
  page: number;
  perPage: number;
  nextPage: number | null;
};

export type GitLabTriageGroupIssuesListFailure = {
  ok: false;
  code: string;
  message: string;
};

export type GitLabTriageGroupIssuesListResponse = GitLabTriageGroupIssuesListSuccess | GitLabTriageGroupIssuesListFailure;
