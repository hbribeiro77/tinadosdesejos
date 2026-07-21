import { stripWishKanbanCardDescriptionMarkdownImageDimensionAttributeSuffixesV1 } from "@/lib/strip-wish-kanban-card-description-markdown-image-dimension-attribute-suffixes-v1";
import { prepareWishKanbanCardDescriptionMarkdownForClientRenderV1 } from "@/lib/prepare-wish-kanban-card-description-markdown-for-client-render-v1";

export { WISH_GITLAB_DESCRIPTION_UPLOADED_ASSET_SERVE_API_PREFIX_V1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-is-valid-for-serve-v1";

/** @deprecated Use `prepareWishKanbanCardDescriptionMarkdownForClientRenderV1`. */
export function prepareGitlabDescriptionMarkdownForClientRenderV1(
  markdown: string,
  options?: { gitlabIssueWebUrl?: string | null },
): string {
  return prepareWishKanbanCardDescriptionMarkdownForClientRenderV1(markdown, {
    issueWebUrl: options?.gitlabIssueWebUrl,
  });
}

export { stripWishKanbanCardDescriptionMarkdownImageDimensionAttributeSuffixesV1 };
