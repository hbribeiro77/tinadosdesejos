import { describe, expect, it } from "vitest";
import { gitlabDvituBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1 } from "@/lib/gitlab-dvitu-build-markdown-append-block-collapsed-details-with-score-table-v1";
import {
  parseDvituMatrixNotaCellLeadingScore,
  parseGitlabIssueMarkdownDescriptionExtractDvituMatrixScoresForTriageHistoryImportV1,
  splitGitlabIssueMarkdownTablePipeRowIntoCells,
} from "@/lib/parse-gitlab-issue-markdown-description-extract-dvitu-matrix-scores-for-triage-history-import-v1";

describe("parseDvituMatrixNotaCellLeadingScore", () => {
  it("aceita traço longo, en-dash e hífen após o dígito", () => {
    expect(parseDvituMatrixNotaCellLeadingScore("4 — Exige pouca")).toBe(4);
    expect(parseDvituMatrixNotaCellLeadingScore("4- Exige pouca")).toBe(4);
    expect(parseDvituMatrixNotaCellLeadingScore("4– Exige pouca")).toBe(4);
  });
});

describe("splitGitlabIssueMarkdownTablePipeRowIntoCells", () => {
  it("divide células com pipe escapado", () => {
    const cells = splitGitlabIssueMarkdownTablePipeRowIntoCells("| a \\| b | 3 — x |");
    expect(cells[0]).toContain("|");
    expect(cells[1]).toMatch(/^3/);
  });
});

describe("parseGitlabIssueMarkdownDescriptionExtractDvituMatrixScoresForTriageHistoryImportV1", () => {
  it("interpreta o mesmo Markdown gerado pelo builder DVITU", () => {
    const append = gitlabDvituBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1({
      performedAtIso: new Date("2025-09-15T17:36:00.000Z").toISOString(),
      scores: { d: 4, v: 5, i: 4, t: 3, u: 5 },
      explanations: { d: "Nota D", v: "", i: "", t: "", u: "" },
    });
    const description = `Texto inicial.\n\n${append}`;
    const r = parseGitlabIssueMarkdownDescriptionExtractDvituMatrixScoresForTriageHistoryImportV1(description);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.scores.d).toBe(4);
    expect(r.scores.v).toBe(5);
    expect(r.scores.i).toBe(4);
    expect(r.scores.t).toBe(3);
    expect(r.scores.u).toBe(5);
    expect(r.explanations.d).toBe("Nota D");
    expect(r.performedAt).not.toBeNull();
  });

  it("interpreta tabela sem bloco details se a tabela estiver solta no texto", () => {
    const append = gitlabDvituBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1({
      performedAtIso: new Date().toISOString(),
      scores: { d: 2, v: 2, i: 2, t: 2, u: 2 },
    });
    const inner = append.match(/<details[^>]*>([\s\S]*?)<\/details>/i)?.[1] ?? "";
    const description = inner.trim();
    const r = parseGitlabIssueMarkdownDescriptionExtractDvituMatrixScoresForTriageHistoryImportV1(description);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.scores.d).toBe(2);
  });
});
