/**
 * Compara nomes de labels ignorando maiúsculas/minúsculas (GitLab preserva o casing da criação da label).
 */
export function wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive(
  snapshotLabelNames: readonly string[],
  requiredLabelNames: readonly string[],
): boolean {
  if (!requiredLabelNames.length) return false;
  const lower = new Set(snapshotLabelNames.map((n) => n.trim().toLowerCase()));
  return requiredLabelNames.every((r) => lower.has(r.trim().toLowerCase()));
}
