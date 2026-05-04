export type GitLabTriageImportDefaultsDto = {
  defaultImportLabelsCsv: string;
  groupPathDisplay: string;
  /** Path do projeto usado por `POST /api/gitlab/issues/create-in-project` (não é segredo). */
  createIssueProjectPathDisplay: string;
  /** Labels que o servidor aplica ao criar issue pelo modal (CSV; vazio = nenhuma). */
  createIssueDefaultLabelsDisplay: string;
  labelsJoinOperator: "and";
  /** Todas precisam estar na issue para exibir o botão Matriz DVITU no card. */
  dvituRequiredIssueLabelNames: string[];
  /** Todas precisam estar na issue para exibir o botão Matriz GUT no card. */
  gutRequiredIssueLabelNames: string[];
};

export async function clientFetchGitlabTriageImportDefaults(): Promise<GitLabTriageImportDefaultsDto | null> {
  try {
    const res = await fetch("/api/gitlab/issues/triage-import-defaults", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as GitLabTriageImportDefaultsDto;
  } catch {
    return null;
  }
}
