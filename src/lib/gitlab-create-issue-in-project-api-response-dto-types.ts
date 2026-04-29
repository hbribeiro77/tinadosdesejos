export type GitLabCreateIssueInProjectSuccessDto = {
  ok: true;
  issueUrl: string;
  webUrl: string;
  iid: number;
};

export type GitLabCreateIssueInProjectFailureDto = {
  ok: false;
  code: string;
  message: string;
};

export type GitLabCreateIssueInProjectResponseDto =
  | GitLabCreateIssueInProjectSuccessDto
  | GitLabCreateIssueInProjectFailureDto;
