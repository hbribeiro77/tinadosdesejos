/** Labels vindos de `GITLAB_TRIAGE_LABEL` (CSV) exigidos na issue para o fluxo DVITU + remoção no submit. */
export function gitlabDvituTriageLabelNamesFromEnvCsvForRemoval(): string[] {
  const raw = (process.env.GITLAB_TRIAGE_LABEL ?? "Triagem de issues").trim();
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length) return parts;
  return ["Triagem de issues"];
}

export function gitlabDvituMelhoriaLabelNameFromEnv(): string {
  return (process.env.GITLAB_DVITU_ELIGIBILITY_MELHORIA_LABEL ?? "Melhoria").trim() || "Melhoria";
}

/** Label aplicada após submeter a matriz (precisa existir no GitLab). */
export function gitlabDvituAppliedLabelNameFromEnv(): string {
  const v = (process.env.GITLAB_DVITU_APPLIED_LABEL_NAME ?? "DVITU").trim();
  return v || "DVITU";
}

/** Todas as labels que precisam estar na issue para abrir o fluxo (triagem CSV + Melhoria). */
export function gitlabDvituRequiredIssueLabelNamesForPlayButtonAndSubmitFromEnv(): string[] {
  const triage = gitlabDvituTriageLabelNamesFromEnvCsvForRemoval();
  const melhoria = gitlabDvituMelhoriaLabelNameFromEnv();
  return [...triage, melhoria].filter((x, i, a) => a.indexOf(x) === i);
}
