export {
  gitlabMarkdownUploadAssetAbsoluteUrlIsUploadPathV1,
  readGitlabOriginFromIssueWebUrlV1,
  toAbsoluteGitlabUploadAssetUrlFromMarkdownTargetV1,
} from "@/lib/gitlab-markdown-upload-asset-description-markdown-target-url-pure-helpers-v1";

import { resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1 } from "@/lib/resolve-gitlab-markdown-upload-asset-target-to-server-fetch-url-v1";
import {
  gitlabMarkdownUploadAssetAbsoluteUrlIsUploadPathV1,
  readGitlabOriginFromIssueWebUrlV1,
  toAbsoluteGitlabUploadAssetUrlFromMarkdownTargetV1,
} from "@/lib/gitlab-markdown-upload-asset-description-markdown-target-url-pure-helpers-v1";

export type ExtractGitlabMarkdownUploadAssetServerFetchUrlsOptionsV1 = {
  gitlabIssueWebUrl?: string | null;
  gitlabBaseUrl?: string | null;
  gitlabProjectPath?: string | null;
};

function resolveTargetToServerFetchUrlV1(
  target: string,
  options?: ExtractGitlabMarkdownUploadAssetServerFetchUrlsOptionsV1,
): string | null {
  const baseUrl = typeof options?.gitlabBaseUrl === "string" ? options.gitlabBaseUrl.trim() : "";
  if (baseUrl) {
    const apiUrl = resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1(target, {
      gitlabBaseUrl: baseUrl,
      gitlabProjectPath: options?.gitlabProjectPath,
      gitlabIssueWebUrl: options?.gitlabIssueWebUrl,
    });
    if (apiUrl) return apiUrl;
  }

  const gitlabOrigin = readGitlabOriginFromIssueWebUrlV1(options?.gitlabIssueWebUrl);
  const absolute = toAbsoluteGitlabUploadAssetUrlFromMarkdownTargetV1(target, gitlabOrigin);
  if (absolute && gitlabMarkdownUploadAssetAbsoluteUrlIsUploadPathV1(absolute)) {
    return absolute;
  }

  return null;
}

/**
 * Lista URLs que o servidor deve buscar (API v4 quando possível).
 * Ordem de aparição; duplicatas preservadas (o espelho deduplica por hash ao gravar).
 */
export function extractGitlabMarkdownUploadAssetServerFetchUrlsFromDescriptionV1(
  markdown: string,
  options?: ExtractGitlabMarkdownUploadAssetServerFetchUrlsOptionsV1,
): string[] {
  if (typeof markdown !== "string" || !markdown.trim()) return [];

  const out: string[] = [];

  markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_full, _alt: string, target: string) => {
    const fetchUrl = resolveTargetToServerFetchUrlV1(target, options);
    if (fetchUrl) out.push(fetchUrl);
    return _full;
  });

  markdown.replace(/<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi, (_full, _before: string, src: string) => {
    const fetchUrl = resolveTargetToServerFetchUrlV1(src, options);
    if (fetchUrl) out.push(fetchUrl);
    return _full;
  });

  return out;
}

/** @deprecated Preferir `extractGitlabMarkdownUploadAssetServerFetchUrlsFromDescriptionV1`. */
export function extractGitlabMarkdownUploadAssetAbsoluteUrlsFromDescriptionV1(
  markdown: string,
  options?: { gitlabIssueWebUrl?: string | null },
): string[] {
  return extractGitlabMarkdownUploadAssetServerFetchUrlsFromDescriptionV1(markdown, options);
}
