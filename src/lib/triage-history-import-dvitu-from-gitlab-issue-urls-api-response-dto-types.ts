export type TriageHistoryImportDvituFromGitlabIssueUrlsResultItemDto =
  | {
      issueUrl: string;
      ok: true;
      insertedRows: number;
      hint: string | null;
    }
  | { issueUrl: string; ok: false; message: string };

export type TriageHistoryImportDvituFromGitlabIssueUrlsResponseDto =
  | { ok: true; data: TriageHistoryImportDvituFromGitlabIssueUrlsResultItemDto[] }
  | { ok: false; code: string; message: string };
