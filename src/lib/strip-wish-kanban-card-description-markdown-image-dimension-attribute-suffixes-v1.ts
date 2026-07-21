/**
 * Remove sufixos de dimensão estilo GitLab (`{width="…" height="…"}`) após imagens markdown.
 * O `react-markdown` não entende essa extensão e exibe o bloco como texto.
 */
export function stripWishKanbanCardDescriptionMarkdownImageDimensionAttributeSuffixesV1(
  markdown: string,
): string {
  if (typeof markdown !== "string" || !markdown.trim()) return markdown;

  return markdown.replace(
    /(!\[[^\]]*\]\([^)]+\))\{[^}]*\}/g,
    "$1",
  );
}
