import { describe, expect, it } from "vitest";
import { gitlabDvituBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1 } from "@/lib/gitlab-dvitu-build-markdown-append-block-collapsed-details-with-score-table-v1";
import {
  gitlabDvituComputePartialProductFromOptionalScores,
  gitlabDvituComputeProductFromDvitUScores,
} from "@/lib/gitlab-dvitu-compute-product-and-partial-product-from-d-v-i-t-u-scores";
import { gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle } from "@/lib/gitlab-dvitu-strip-leading-dvitu-bracket-note-prefix-from-issue-title";

describe("gitlabDvituComputeProductFromDvitUScores", () => {
  it("multiplica D×V×I×T×U (exemplo 4×5×4×3×5 = 1200)", () => {
    expect(
      gitlabDvituComputeProductFromDvitUScores({
        d: 4,
        v: 5,
        i: 4,
        t: 3,
        u: 5,
      }),
    ).toBe(1200);
  });
});

describe("gitlabDvituComputePartialProductFromOptionalScores", () => {
  it("retorna null se nada selecionado", () => {
    expect(gitlabDvituComputePartialProductFromOptionalScores({ d: null, v: null, i: null, t: null, u: null })).toBeNull();
  });

  it("multiplica só os fatores definidos", () => {
    expect(
      gitlabDvituComputePartialProductFromOptionalScores({
        d: 2,
        v: 3,
        i: null,
        t: null,
        u: null,
      }),
    ).toBe(6);
  });
});

describe("gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle", () => {
  it("remove prefixo DVITU case-insensitive", () => {
    expect(gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle("[DVITU: 1200] Título")).toBe("Título");
    expect(gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle("[dvitu: 99] X")).toBe("X");
  });

  it("não altera título sem prefixo", () => {
    expect(gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle("Só título")).toBe("Só título");
  });
});

describe("gitlabDvituBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1", () => {
  it("inclui details, summary, tabela e total com produto", () => {
    const block = gitlabDvituBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1({
      performedAtIso: "2025-09-15T20:41:00.000Z",
      scores: { d: 4, u: 5, t: 3, v: 5, i: 4 },
    });
    expect(block).toContain("<details>");
    expect(block).toContain("</details>");
    expect(block).toContain("Matriz DVITU realizada em");
    expect(block).toContain("| Matriz DVITU | Nota |");
    expect(block).toContain("| Desenvolvimento |");
    expect(block).toContain("| Total | [DVITU: 1200] |");
  });
});
