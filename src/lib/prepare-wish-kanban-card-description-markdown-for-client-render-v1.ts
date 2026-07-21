import { stripWishKanbanCardDescriptionMarkdownImageDimensionAttributeSuffixesV1 } from "@/lib/strip-wish-kanban-card-description-markdown-image-dimension-attribute-suffixes-v1";
import { rewriteWishKanbanCardDescriptionMarkdownImageUrlsForClientRenderV1 } from "@/lib/rewrite-wish-kanban-card-description-markdown-image-urls-for-client-render-v1";

/**
 * Prepara markdown armazenado no snapshot do card para exibição na Tina
 * (modal Ver descrição): remove atributos de dimensão e reescreve URLs de imagem.
 */
export function prepareWishKanbanCardDescriptionMarkdownForClientRenderV1(
  markdown: string,
  options?: { issueWebUrl?: string | null; projectPath?: string | null },
): string {
  if (typeof markdown !== "string" || !markdown.trim()) return markdown;

  const stripped = stripWishKanbanCardDescriptionMarkdownImageDimensionAttributeSuffixesV1(markdown);
  return rewriteWishKanbanCardDescriptionMarkdownImageUrlsForClientRenderV1(stripped, options);
}
