import { gitlabDvituTriageLabelNamesFromEnvCsvForRemoval } from "@/lib/gitlab-dvitu-read-required-label-names-from-env-for-eligibility-and-removal";

export function gitlabGutBugLabelNameFromEnv(): string {
  return (process.env.GITLAB_GUT_ELIGIBILITY_BUG_LABEL ?? "Bug").trim() || "Bug";
}

export function gitlabGutAppliedLabelNameFromEnv(): string {
  const v = (process.env.GITLAB_GUT_APPLIED_LABEL_NAME ?? "GUT").trim();
  return v || "GUT";
}

/** Triagem (CSV env) + Bug — labels que precisam estar na issue para o fluxo GUT. */
export function gitlabGutRequiredIssueLabelNamesForPlayButtonAndSubmitFromEnv(): string[] {
  const triage = gitlabDvituTriageLabelNamesFromEnvCsvForRemoval();
  const bug = gitlabGutBugLabelNameFromEnv();
  return [...triage, bug].filter((x, i, a) => a.indexOf(x) === i);
}
