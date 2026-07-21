import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import { extractGitlabMarkdownUploadAssetServerFetchUrlsFromDescriptionV1 } from "@/lib/extract-gitlab-markdown-upload-asset-absolute-urls-from-description-v1";
import { gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag } from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";
import {
  gitlabMarkdownUploadAssetServerFetchUrlIsAllowedV1,
  resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1,
} from "@/lib/resolve-gitlab-markdown-upload-asset-target-to-server-fetch-url-v1";
import {
  wishGitlabDescriptionUploadedAssetFileNameFromAbsoluteUrlV1,
  wishGitlabDescriptionUploadedAssetLocalServeUrlFromFileNameV1,
} from "@/lib/wish-gitlab-description-uploaded-asset-file-name-from-absolute-url-v1";

export const WISH_GITLAB_DESCRIPTION_UPLOADED_ASSETS_DATA_DIRECTORY_NAME_V1 =
  "gitlab-description-uploaded-assets-v1";

export function wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1(
  cwd: string = process.cwd(),
): string {
  return path.join(cwd, "data", WISH_GITLAB_DESCRIPTION_UPLOADED_ASSETS_DATA_DIRECTORY_NAME_V1);
}

type MirrorResolveOptionsV1 = {
  gitlabBaseUrl: string;
  gitlabProjectPath: string;
  gitlabIssueWebUrl: string;
};

function rewriteMarkdownImageTargetsToLocalServeUrlsV1(
  markdown: string,
  resolveOptions: MirrorResolveOptionsV1,
  fetchUrlToLocalServeUrl: ReadonlyMap<string, string>,
): string {
  return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt: string, target: string) => {
    const fetchUrl = resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1(target, resolveOptions);
    if (!fetchUrl) return full;
    const local = fetchUrlToLocalServeUrl.get(fetchUrl);
    if (!local) return full;
    return `![${alt}](${local})`;
  });
}

function rewriteHtmlImgSrcToLocalServeUrlsV1(
  markdown: string,
  resolveOptions: MirrorResolveOptionsV1,
  fetchUrlToLocalServeUrl: ReadonlyMap<string, string>,
): string {
  return markdown.replace(
    /<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi,
    (full, before: string, src: string, after: string) => {
      const fetchUrl = resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1(src, resolveOptions);
      if (!fetchUrl) return full;
      const local = fetchUrlToLocalServeUrl.get(fetchUrl);
      if (!local) return full;
      return `<img${before} src="${local}"${after}>`;
    },
  );
}

export type MirrorGitlabIssueDescriptionUploadAssetsOnServerOptionsV1 = {
  gitlabIssueWebUrl: string;
  gitlabProjectPath: string;
  gitlabBaseUrl: string;
  token: string;
  tlsInsecureDev: boolean;
  /** Sobrescreve `data/gitlab-description-uploaded-assets-v1` (testes). */
  dataDirectoryAbsolutePath?: string;
};

/**
 * Baixa imagens da descrição para disco local e reescreve o markdown com URLs da Tina.
 * Falhas por imagem são ignoradas (markdown mantém URL original daquela imagem).
 */
export async function mirrorGitlabIssueDescriptionUploadAssetsToLocalDataDirectoryAndRewriteMarkdownOnServerV1(
  markdown: string,
  options: MirrorGitlabIssueDescriptionUploadAssetsOnServerOptionsV1,
): Promise<string> {
  if (typeof markdown !== "string" || !markdown.trim()) return markdown;

  const resolveOptions: MirrorResolveOptionsV1 = {
    gitlabBaseUrl: options.gitlabBaseUrl,
    gitlabProjectPath: options.gitlabProjectPath,
    gitlabIssueWebUrl: options.gitlabIssueWebUrl,
  };

  const uniqueFetchUrls = [
    ...new Set(
      extractGitlabMarkdownUploadAssetServerFetchUrlsFromDescriptionV1(markdown, {
        gitlabIssueWebUrl: options.gitlabIssueWebUrl,
        gitlabBaseUrl: options.gitlabBaseUrl,
        gitlabProjectPath: options.gitlabProjectPath,
      }),
    ),
  ];

  if (uniqueFetchUrls.length === 0) return markdown;

  const dataDir =
    options.dataDirectoryAbsolutePath ?? wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1();
  await mkdir(dataDir, { recursive: true });

  const fetchUrlToLocalServeUrl = new Map<string, string>();

  for (const fetchUrl of uniqueFetchUrls) {
    if (!gitlabMarkdownUploadAssetServerFetchUrlIsAllowedV1(fetchUrl, options.gitlabBaseUrl)) {
      continue;
    }

    const fileName = wishGitlabDescriptionUploadedAssetFileNameFromAbsoluteUrlV1(fetchUrl);
    if (!fileName) continue;

    const raw = await gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag(
      fetchUrl,
      options.token,
      options.tlsInsecureDev,
    );

    if (!raw.ok || raw.status < 200 || raw.status >= 300) {
      console.warn(
        "[Tina] Falha ao espelhar imagem da descrição:",
        fetchUrl,
        raw.ok ? `HTTP ${raw.status}` : raw.cause,
      );
      continue;
    }

    await writeFile(path.join(dataDir, fileName), raw.body);
    fetchUrlToLocalServeUrl.set(
      fetchUrl,
      wishGitlabDescriptionUploadedAssetLocalServeUrlFromFileNameV1(fileName),
    );
  }

  if (fetchUrlToLocalServeUrl.size === 0) return markdown;

  let out = rewriteMarkdownImageTargetsToLocalServeUrlsV1(markdown, resolveOptions, fetchUrlToLocalServeUrl);
  out = rewriteHtmlImgSrcToLocalServeUrlsV1(out, resolveOptions, fetchUrlToLocalServeUrl);
  return out;
}

export type EnrichGitLabIssueSummaryDtoWithMirroredDescriptionUploadAssetsOptionsV1 = {
  gitlabBaseUrl: string;
  token: string;
  tlsInsecureDev: boolean;
  /** `GITLAB_MOCK=1` ou testes sem download. */
  skipMirror?: boolean;
  dataDirectoryAbsolutePath?: string;
};

export async function enrichGitLabIssueSummaryDtoWithMirroredDescriptionUploadAssetsOnServerV1(
  dto: GitLabIssueSummaryDto,
  options: EnrichGitLabIssueSummaryDtoWithMirroredDescriptionUploadAssetsOptionsV1,
): Promise<GitLabIssueSummaryDto> {
  if (options.skipMirror) return dto;

  const markdown = dto.gitlabDescriptionMarkdown?.trim();
  if (!markdown || !dto.webUrl?.trim() || !dto.projectPath?.trim()) return dto;

  const rewritten = await mirrorGitlabIssueDescriptionUploadAssetsToLocalDataDirectoryAndRewriteMarkdownOnServerV1(
    dto.gitlabDescriptionMarkdown ?? "",
    {
      gitlabIssueWebUrl: dto.webUrl,
      gitlabProjectPath: dto.projectPath,
      gitlabBaseUrl: options.gitlabBaseUrl,
      token: options.token,
      tlsInsecureDev: options.tlsInsecureDev,
      dataDirectoryAbsolutePath: options.dataDirectoryAbsolutePath,
    },
  );

  if (rewritten === dto.gitlabDescriptionMarkdown) return dto;

  return {
    ...dto,
    gitlabDescriptionMarkdown: rewritten,
  };
}
