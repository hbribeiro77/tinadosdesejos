/** Formata timestamps ISO (GitLab) para leitura rápida em PT-BR. */
export function formatIso8601DateTimeForUiDisplayBrazilLocaleShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
