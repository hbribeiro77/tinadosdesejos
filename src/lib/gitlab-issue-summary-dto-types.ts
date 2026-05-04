export type GitLabIssueLabelSummaryDto = {
  name: string;
  color: string | null;
};

export type GitLabIssueAssigneeSummaryDto = {
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type GitLabIssueSummaryDto = {
  /** ID numérico global da issue na API do GitLab (útil para DnD/keys estáveis). */
  gitlabIssueId?: number;
  iid: number;
  title: string;
  state: string;
  webUrl: string;
  projectPath: string;
  labels: GitLabIssueLabelSummaryDto[];
  assignees: GitLabIssueAssigneeSummaryDto[];
  /** ISO 8601 — `created_at` da API REST do GitLab. */
  createdAt: string;
  updatedAt: string;
  /** Presente quando o card veio do SmartTask ( Markdown livre da exportação ). */
  smartTaskDescriptionMarkdown?: string;
  /** Texto extra para busca no quadro (descrição + subtarefas + metadados SmartTask). */
  smartTaskSearchHaystack?: string;
};

export type GitLabIssueResolveSuccess = {
  ok: true;
  data: GitLabIssueSummaryDto;
};

export type GitLabIssueResolveFailure = {
  ok: false;
  code: string;
  message: string;
};

export type GitLabIssueResolveResponse =
  | GitLabIssueResolveSuccess
  | GitLabIssueResolveFailure;
