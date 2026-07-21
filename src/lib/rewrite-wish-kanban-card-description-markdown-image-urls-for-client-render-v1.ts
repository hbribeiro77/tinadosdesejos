import {
  gitlabMarkdownUploadAssetAbsoluteUrlIsUploadPathV1,
  readGitlabOriginFromIssueWebUrlV1,
  toAbsoluteGitlabUploadAssetUrlFromMarkdownTargetV1,
} from "@/lib/gitlab-markdown-upload-asset-description-markdown-target-url-pure-helpers-v1";
import { WISH_GITLAB_DESCRIPTION_UPLOADED_ASSET_SERVE_API_PREFIX_V1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-is-valid-for-serve-v1";

const WISH_KANBAN_CARD_DESCRIPTION_IMAGE_PROXY_PATH_V1 = "/api/wish-kanban-board/description-image-proxy-v1";

function toProxySrc(markdownTarget: string, projectPath: string | null): string {
  const params = new URLSearchParams({ url: markdownTarget.trim() });
  if (projectPath?.trim()) {
    params.set("projectPath", projectPath.trim());
  }
  return `${WISH_KANBAN_CARD_DESCRIPTION_IMAGE_PROXY_PATH_V1}?${params.toString()}`;
}

function markdownTargetLooksLikeUploadAssetV1(target: string, issueOrigin: string | null): boolean {
  const trimmed = target.trim();
  if (trimmed.includes("/uploads/")) return true;
  const absolute = toAbsoluteGitlabUploadAssetUrlFromMarkdownTargetV1(trimmed, issueOrigin);
  return Boolean(absolute && gitlabMarkdownUploadAssetAbsoluteUrlIsUploadPathV1(absolute));
}

function rewriteMarkdownImageTargets(
  markdown: string,
  issueOrigin: string | null,
  projectPath: string | null,
): string {
  return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt: string, target: string) => {
    const trimmedTarget = target.trim();
    if (trimmedTarget.startsWith(WISH_GITLAB_DESCRIPTION_UPLOADED_ASSET_SERVE_API_PREFIX_V1)) {
      return full;
    }
    if (!markdownTargetLooksLikeUploadAssetV1(trimmedTarget, issueOrigin)) {
      return full;
    }
    return `![${alt}](${toProxySrc(trimmedTarget, projectPath)})`;
  });
}

function rewriteHtmlImgSrc(markdown: string, issueOrigin: string | null, projectPath: string | null): string {
  return markdown.replace(
    /<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi,
    (full, before: string, src: string, after: string) => {
      const trimmedSrc = src.trim();
      if (trimmedSrc.startsWith(WISH_GITLAB_DESCRIPTION_UPLOADED_ASSET_SERVE_API_PREFIX_V1)) {
        return full;
      }
      if (!markdownTargetLooksLikeUploadAssetV1(trimmedSrc, issueOrigin)) {
        return full;
      }
      return `<img${before} src="${toProxySrc(trimmedSrc, projectPath)}"${after}>`;
    },
  );
}

/** Reescreve `/uploads/…` do snapshot para rota de imagem da Tina (espelho local ou proxy). */
export function rewriteWishKanbanCardDescriptionMarkdownImageUrlsForClientRenderV1(
  markdown: string,
  options?: { issueWebUrl?: string | null; projectPath?: string | null },
): string {
  if (typeof markdown !== "string" || !markdown.trim()) return markdown;

  const issueOrigin = readGitlabOriginFromIssueWebUrlV1(options?.issueWebUrl);
  const projectPath = options?.projectPath ?? null;
  let out = rewriteMarkdownImageTargets(markdown, issueOrigin, projectPath);
  out = rewriteHtmlImgSrc(out, issueOrigin, projectPath);
  return out;
}

export const WISH_KANBAN_CARD_DESCRIPTION_IMAGE_PROXY_API_PATH_V1 = WISH_KANBAN_CARD_DESCRIPTION_IMAGE_PROXY_PATH_V1;
