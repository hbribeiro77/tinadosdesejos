import { describe, expect, it } from "vitest";
import { gitlabGutBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1 } from "@/lib/gitlab-gut-build-markdown-append-block-collapsed-details-with-score-table-v1";
import {
  gitlabGutComputePartialProductFromOptionalScores,
  gitlabGutComputeProductFromGutScores,
} from "@/lib/gitlab-gut-compute-product-and-partial-product-from-g-u-t-scores";
import { gitlabGutStripLeadingGutBracketNotePrefixFromIssueTitle } from "@/lib/gitlab-gut-strip-leading-gut-bracket-note-prefix-from-issue-title";

describe("gitlabGutComputeProductFromGutScores", () => {
  it("multiplica G×U×T (ex.: 2×3×5 = 30)", () => {
    expect(gitlabGutComputeProductFromGutScores({ g: 2, u: 3, t: 5 })).toBe(30);
  });
});

describe("gitlabGutComputePartialProductFromOptionalScores", () => {
  it("retorna null se nada selecionado", () => {
    expect(gitlabGutComputePartialProductFromOptionalScores({ g: null, u: null, t: null })).toBeNull();
  });

  it("multiplica só fatores definidos", () => {
    expect(gitlabGutComputePartialProductFromOptionalScores({ g: 2, u: 3, t: null })).toBe(6);
  });
});

describe("gitlabGutStripLeadingGutBracketNotePrefixFromIssueTitle", () => {
  it("remove prefixo GUT", () => {
    expect(gitlabGutStripLeadingGutBracketNotePrefixFromIssueTitle("[GUT: 30] Título")).toBe("Título");
  });
});

describe("gitlabGutBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1", () => {
  it("inclui details, tabela e total", () => {
    const block = gitlabGutBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1({
      performedAtIso: "2025-09-15T20:41:00.000Z",
      scores: { g: 1, u: 1, t: 1 },
    });
    expect(block).toContain("<details>");
    expect(block).toContain("Matriz GUT realizada em");
    expect(block).toContain("| Gravidade |");
    expect(block).toContain("| Total | [GUT: 1] |");
  });
});
