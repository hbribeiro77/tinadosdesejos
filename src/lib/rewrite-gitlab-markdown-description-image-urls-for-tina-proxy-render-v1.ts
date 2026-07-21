import {
  gitlabMarkdownUploadAssetAbsoluteUrlIsUploadPathV1,
  readGitlabOriginFromIssueWebUrlV1,
  toAbsoluteGitlabUploadAssetUrlFromMarkdownTargetV1,
} from "@/lib/gitlab-markdown-upload-asset-description-markdown-target-url-pure-helpers-v1";

const GITLAB_MARKDOWN_UPLOAD_ASSET_PROXY_PATH = "/api/gitlab/markdown-upload-asset-proxy-v1";

function toProxySrc(absoluteAssetUrl: string): string {
  return `${GITLAB_MARKDOWN_UPLOAD_ASSET_PROXY_PATH}?url=${encodeURIComponent(absoluteAssetUrl)}`;
}

function rewriteMarkdownImageTargets(markdown: string, gitlabOrigin: string | null): string {
  return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt: string, target: string) => {
    const absolute = toAbsoluteGitlabUploadAssetUrlFromMarkdownTargetV1(target, gitlabOrigin);
    if (!absolute || !gitlabMarkdownUploadAssetAbsoluteUrlIsUploadPathV1(absolute)) {
      return full;
    }
    return `![${alt}](${toProxySrc(absolute)})`;
  });
}

function rewriteHtmlImgSrc(markdown: string, gitlabOrigin: string | null): string {
  return markdown.replace(
    /<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi,
    (full, before: string, src: string, after: string) => {
      const absolute = toAbsoluteGitlabUploadAssetUrlFromMarkdownTargetV1(src, gitlabOrigin);
      if (!absolute || !gitlabMarkdownUploadAssetAbsoluteUrlIsUploadPathV1(absolute)) {
        return full;
      }
      return `<img${before} src="${toProxySrc(absolute)}"${after}>`;
    },
  );
}

/**
 * Reescreve imagens Markdown/HTML de uploads do GitLab para o proxy autenticado da Tina.
 * Fallback para snapshots antigos sem espelho local.
 */
export function rewriteGitlabMarkdownDescriptionImageUrlsForTinaProxyRenderV1(
  markdown: string,
  options?: { gitlabIssueWebUrl?: string | null },
): string {
  if (typeof markdown !== "string" || !markdown.trim()) return markdown;

  const gitlabOrigin = readGitlabOriginFromIssueWebUrlV1(options?.gitlabIssueWebUrl);
  let out = rewriteMarkdownImageTargets(markdown, gitlabOrigin);
  out = rewriteHtmlImgSrc(out, gitlabOrigin);
  return out;
}

export const GITLAB_MARKDOWN_UPLOAD_ASSET_PROXY_API_PATH_V1 = GITLAB_MARKDOWN_UPLOAD_ASSET_PROXY_PATH;
