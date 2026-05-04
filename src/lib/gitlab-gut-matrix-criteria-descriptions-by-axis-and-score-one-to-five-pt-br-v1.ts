/** Eixos da matriz GUT. Nota = G×U×T. */
export type GitlabGutAxisKey = "g" | "u" | "t";

export type GitlabGutAxisDefinitionPtBrV1 = {
  key: GitlabGutAxisKey;
  tableRowLabel: string;
  radioGroupLegend: string;
  descriptionsByScoreOneToFive: [string, string, string, string, string];
};

export const GITLAB_GUT_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1: readonly GitlabGutAxisDefinitionPtBrV1[] = [
  {
    key: "g",
    tableRowLabel: "Gravidade",
    radioGroupLegend: "Gravidade",
    descriptionsByScoreOneToFive: [
      "Sem gravidade.",
      "Pouco grave.",
      "Grave.",
      "Muito grave.",
      "Extremamente grave.",
    ],
  },
  {
    key: "u",
    tableRowLabel: "Urgência",
    radioGroupLegend: "Urgência",
    descriptionsByScoreOneToFive: [
      "Pode esperar.",
      "Pouco urgente.",
      "Urgente, merece atenção no curto prazo.",
      "Muito urgente.",
      "Necessidade de ação imediata.",
    ],
  },
  {
    key: "t",
    tableRowLabel: "Tendência",
    radioGroupLegend: "Tendência",
    descriptionsByScoreOneToFive: [
      "Não irá mudar.",
      "Irá piorar a longo prazo.",
      "Irá piorar a médio prazo.",
      "Irá piorar a curto prazo.",
      "Irá piorar rapidamente.",
    ],
  },
] as const;

export function gitlabGutDescriptionForAxisAndScorePtBrV1(axis: GitlabGutAxisKey, score: 1 | 2 | 3 | 4 | 5): string {
  const def = GITLAB_GUT_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1.find((x) => x.key === axis);
  if (!def) throw new Error(`Eixo GUT desconhecido: ${axis}`);
  return def.descriptionsByScoreOneToFive[score - 1];
}
