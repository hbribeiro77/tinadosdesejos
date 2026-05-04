import { formatIso8601DateTimeForUiDisplayBrazilLocaleShort } from "@/lib/format-iso-8601-date-time-for-ui-display-brazil-locale-short";
import {
  GITLAB_DVITU_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1,
  gitlabDvituDescriptionForAxisAndScorePtBrV1,
  type GitlabDvituAxisKey,
} from "@/lib/gitlab-dvitu-matrix-criteria-descriptions-by-axis-and-score-one-to-five-pt-br-v1";
import { gitlabDvituComputeProductFromDvitUScores } from "@/lib/gitlab-dvitu-compute-product-and-partial-product-from-d-v-i-t-u-scores";

export type GitlabDvituScoresForMarkdownBlockV1 = Record<GitlabDvituAxisKey, 1 | 2 | 3 | 4 | 5>;
export type GitlabDvituExplanationsForMarkdownBlockV1 = Record<GitlabDvituAxisKey, string | undefined>;


function escapeMarkdownCellPipe(text: string): string {
  return text.replace(/\|/g, "\\|");
}

function escapeHtmlTextForDetailsSummary(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatNotaCell(score: number, axis: GitlabDvituAxisKey): string {
  const desc = gitlabDvituDescriptionForAxisAndScorePtBrV1(axis, score as 1 | 2 | 3 | 4 | 5);
  return `${score} — ${desc}`;
}

/**
 * Bloco a ser anexado ao final da descrição da issue no GitLab.
 * Usa `<details>` para ficar colapsado por padrão no renderizador do GitLab.
 */
export function gitlabDvituBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1(params: {
  performedAtIso: string;
  scores: GitlabDvituScoresForMarkdownBlockV1;
  explanations?: GitlabDvituExplanationsForMarkdownBlockV1;
}): string {
  const { performedAtIso, scores, explanations } = params;
  const when = formatIso8601DateTimeForUiDisplayBrazilLocaleShort(performedAtIso);
  const product = gitlabDvituComputeProductFromDvitUScores(scores);

  const hasExplanations = explanations && Object.values(explanations).some((e) => e && e.trim().length > 0);

  const header = hasExplanations 
    ? "| Matriz DVITU | Nota | Justificativa |\n| --- | --- | --- |\n"
    : "| Matriz DVITU | Nota |\n| --- | --- |\n";

  const bodyRows = GITLAB_DVITU_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1.map((def) => {
    const s = scores[def.key];
    const left = escapeMarkdownCellPipe(def.tableRowLabel);
    const right = escapeMarkdownCellPipe(formatNotaCell(s, def.key));
    if (hasExplanations) {
      const expl = explanations?.[def.key];
      const explCell = expl ? escapeMarkdownCellPipe(expl.trim()) : "—";
      return `| ${left} | ${right} | ${explCell} |`;
    }
    return `| ${left} | ${right} |`;
  }).join("\n");

  const totalRow = hasExplanations 
    ? `| Total | [DVITU: ${product}] | |`
    : `| Total | [DVITU: ${product}] |`;

  const table = `${header}${bodyRows}\n${totalRow}`;

  return [
    "",
    `<details>`,
    `<summary>Matriz DVITU realizada em ${escapeHtmlTextForDetailsSummary(when)}</summary>`,
    "",
    table,
    "",
    `</details>`,
    "",
  ].join("\n");
}
