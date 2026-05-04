/** Eixos da matriz DVITU (ordem de exibição na tabela anexa: D, U, T, V, I). Nota final = D×V×I×T×U. */
export type GitlabDvituAxisKey = "d" | "u" | "t" | "v" | "i";

export type GitlabDvituAxisDefinitionPtBrV1 = {
  key: GitlabDvituAxisKey;
  /** Rótulo curto na primeira coluna da tabela Markdown. */
  tableRowLabel: string;
  /** Título do grupo de rádio na UI. */
  radioGroupLegend: string;
  /** Texto por pontuação 1–5 (índice 0 = nota 1). */
  descriptionsByScoreOneToFive: [string, string, string, string, string];
};

export const GITLAB_DVITU_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1: readonly GitlabDvituAxisDefinitionPtBrV1[] = [
  {
    key: "d",
    tableRowLabel: "Desenvolvimento",
    radioGroupLegend: "Desenvolvimento (esforço para implementar)",
    descriptionsByScoreOneToFive: [
      "Exige muita análise, muito desenvolvimento ainda há regras de negócio não definidas.",
      "Exige muita análise, muito desenvolvimento.",
      "Exige análise e desenvolvimento médio.",
      "Exige pouca análise e desenvolvimento médio.",
      "Exige pouco ou nenhum desenvolvimento.",
    ],
  },
  {
    key: "u",
    tableRowLabel: "Uso",
    radioGroupLegend: "Uso (abrangência de usuários afetados)",
    descriptionsByScoreOneToFive: [
      "Grupo bem restrito de usuários. (Exemplo: Apenas subjurídico ou apenas defensores do SEEU)",
      "Menos da metade, mas sem restrição de grupo/setor.",
      "Metade dos usuários.",
      "Mais que a metade, mas não todos os usuários.",
      "Todos os usuários.",
    ],
  },
  {
    key: "t",
    tableRowLabel: "Tendência",
    radioGroupLegend: "Tendência (urgência / evolução do problema se não tratado)",
    descriptionsByScoreOneToFive: [
      "Não irá mudar ou existe solução de contorno.",
      "Irá piorar a longo prazo (nos próximos anos).",
      "Irá piorar a médio prazo (nas próximas meses).",
      "Irá piorar a curto prazo (nas próximas semanas).",
      "Irá piorar rapidamente (nos próximos dias).",
    ],
  },
  {
    key: "v",
    tableRowLabel: "Vontade",
    radioGroupLegend: "Vontade (o quanto a administração quer essa funcionalidade)",
    descriptionsByScoreOneToFive: [
      "Pode esperar. (não queremos fazer)",
      "Queremos a longo prazo. (nos próximos anos)",
      "Queremos em médio prazo. (nas próximas meses)",
      "Queremos em curto prazo. (nas próximas semanas)",
      "Necessidade de ação imediata. (nos próximos dias)",
    ],
  },
  {
    key: "i",
    tableRowLabel: "Impacto",
    radioGroupLegend: "Impacto (relação carga de trabalho × tempo se for desenvolvida)",
    descriptionsByScoreOneToFive: [
      "Vai piorar muito a carga de trabalho ou o tempo gasto nas atividades.",
      "Vai piorar pouco a carga de trabalho ou o tempo gasto nas atividades.",
      "Não vai mudar nada para os usuários afetados.",
      "Vai reduzir pouco a carga de trabalho ou o tempo gasto nas atividades.",
      "Vai reduzir muito a carga de trabalho ou o tempo gasto nas atividades.",
    ],
  },
] as const;

export function gitlabDvituDescriptionForAxisAndScorePtBrV1(axis: GitlabDvituAxisKey, score: 1 | 2 | 3 | 4 | 5): string {
  const def = GITLAB_DVITU_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1.find((x) => x.key === axis);
  if (!def) throw new Error(`Eixo DVITU desconhecido: ${axis}`);
  return def.descriptionsByScoreOneToFive[score - 1];
}
