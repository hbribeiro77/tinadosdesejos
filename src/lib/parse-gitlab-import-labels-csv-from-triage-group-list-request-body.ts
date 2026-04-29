/** Normaliza lista separada por vírgulas (trim, remove vazios). */
export function normalizeCommaSeparatedGitlabImportLabelsCsv(csv: string): string {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");
}

/**
 * Extrai labels enviadas pelo cliente em `POST triage-group-list`.
 * Aceita `labelsCsv` (string) ou `labels` (array de strings).
 */
export function parseGitLabImportLabelsCsvFromTriageGroupListBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  if (typeof o.labelsCsv === "string") {
    const normalized = normalizeCommaSeparatedGitlabImportLabelsCsv(o.labelsCsv);
    return normalized.length ? normalized : null;
  }

  if (Array.isArray(o.labels)) {
    const parts = o.labels
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts.join(",") : null;
  }

  return null;
}
