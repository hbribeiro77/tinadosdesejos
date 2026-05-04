import { formatIso8601DateTimeForUiDisplayBrazilLocaleShort } from "@/lib/format-iso-8601-date-time-for-ui-display-brazil-locale-short";
import {
  GITLAB_GUT_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1,
  gitlabGutDescriptionForAxisAndScorePtBrV1,
  type GitlabGutAxisKey,
} from "@/lib/gitlab-gut-matrix-criteria-descriptions-by-axis-and-score-one-to-five-pt-br-v1";
import { gitlabGutComputeProductFromGutScores } from "@/lib/gitlab-gut-compute-product-and-partial-product-from-g-u-t-scores";

export type GitlabGutScoresForMarkdownBlockV1 = Record<GitlabGutAxisKey, 1 | 2 | 3 | 4 | 5>;

function escapeMarkdownCellPipe(text: string): string {
  return text.replace(/\|/g, "\\|");
}

function escapeHtmlTextForDetailsSummary(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatNotaCell(score: number, axis: GitlabGutAxisKey): string {
  const desc = gitlabGutDescriptionForAxisAndScorePtBrV1(axis, score as 1 | 2 | 3 | 4 | 5);
  return `${score} — ${desc}`;
}

export function gitlabGutBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1(params: {
  performedAtIso: string;
  scores: GitlabGutScoresForMarkdownBlockV1;
}): string {
  const { performedAtIso, scores } = params;
  const when = formatIso8601DateTimeForUiDisplayBrazilLocaleShort(performedAtIso);
  const product = gitlabGutComputeProductFromGutScores(scores);

  const header = "| Matriz GUT | Nota |\n| --- | --- |\n";
  const bodyRows = GITLAB_GUT_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1.map((def) => {
    const s = scores[def.key];
    const left = escapeMarkdownCellPipe(def.tableRowLabel);
    const right = escapeMarkdownCellPipe(formatNotaCell(s, def.key));
    return `| ${left} | ${right} |`;
  }).join("\n");

  const totalRow = `| Total | [GUT: ${product}] |`;
  const table = `${header}${bodyRows}\n${totalRow}`;

  return [
    "",
    `<details>`,
    `<summary>Matriz GUT realizada em ${escapeHtmlTextForDetailsSummary(when)}</summary>`,
    "",
    table,
    "",
    `</details>`,
    "",
  ].join("\n");
}
