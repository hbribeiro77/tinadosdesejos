import { normalizeGitlabBaseUrlForServerRequestsV1 } from "@/lib/normalize-gitlab-base-url-for-server-requests-v1";

/** `portal-da-defensoria/portal-defensoria-gateway` a partir do link web da issue/work item. */
export function readGitlabProjectPathFromIssueWebUrlV1(webUrl: string | null | undefined): string | null {
  const trimmed = typeof webUrl === "string" ? webUrl.trim() : "";
  if (!trimmed) return null;

  try {
    const pathname = new URL(trimmed).pathname.replace(/\/+$/, "");
    const match = pathname.match(/^\/(.+)\/-\/(?:issues|work_items)\/(\d+)$/);
    return match ? decodeURIComponent(match[1]!) : null;
  } catch {
    return null;
  }
}

export function gitlabMarkdownUploadPathnameSecretAndFileNameFromPathV1(
  pathname: string,
): { secret: string; fileName: string } | null {
  const match = pathname.match(/\/uploads\/([^/]+)\/([^/]+)$/i);
  if (!match) return null;
  return { secret: match[1]!, fileName: match[2]! };
}

/** Monta URL autenticável via API v4: `…/api/v4/projects/:path/uploads/:secret/:file`. */
export function gitlabApiV4ProjectUploadAssetFetchUrlFromUploadPathnameV1(
  pathname: string,
  options: { gitlabBaseUrl: string; gitlabProjectPath: string },
): string | null {
  const parts = gitlabMarkdownUploadPathnameSecretAndFileNameFromPathV1(pathname);
  if (!parts) return null;

  const base = normalizeGitlabBaseUrlForServerRequestsV1(options.gitlabBaseUrl);
  const project = encodeURIComponent(options.gitlabProjectPath.trim());
  return `${base}/api/v4/projects/${project}/uploads/${parts.secret}/${parts.fileName}`;
}

export type ResolveGitlabMarkdownUploadAssetTargetToServerFetchUrlOptionsV1 = {
  gitlabBaseUrl: string;
  gitlabProjectPath?: string | null;
  gitlabIssueWebUrl?: string | null;
};

/**
 * Converte alvo markdown (`/uploads/…/file.png`) na URL que o servidor consegue baixar com token.
 * Uploads web (`/uploads/…`) redirecionam para login; a API v4 do projeto retorna o binário.
 */
export function resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1(
  target: string,
  options: ResolveGitlabMarkdownUploadAssetTargetToServerFetchUrlOptionsV1,
): string | null {
  const raw = target.trim();
  if (!raw) return null;

  const projectPath =
    (typeof options.gitlabProjectPath === "string" ? options.gitlabProjectPath.trim() : "") ||
    readGitlabProjectPathFromIssueWebUrlV1(options.gitlabIssueWebUrl);
  if (!projectPath) return null;

  const resolveOpts = { gitlabBaseUrl: options.gitlabBaseUrl, gitlabProjectPath: projectPath };

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const u = new URL(raw);
      if (u.pathname.includes("/api/v4/projects/") && u.pathname.toLowerCase().includes("/uploads/")) {
        return raw;
      }
      return gitlabApiV4ProjectUploadAssetFetchUrlFromUploadPathnameV1(u.pathname, resolveOpts);
    } catch {
      return null;
    }
  }

  const pathname = raw.startsWith("/") ? raw : `/${raw}`;
  return gitlabApiV4ProjectUploadAssetFetchUrlFromUploadPathnameV1(pathname, resolveOpts);
}

export function gitlabMarkdownUploadAssetServerFetchUrlIsAllowedV1(
  fetchUrl: string,
  gitlabBaseUrl: string,
): boolean {
  const trimmed = typeof fetchUrl === "string" ? fetchUrl.trim() : "";
  if (!trimmed) return false;

  let assetUrl: URL;
  try {
    assetUrl = new URL(trimmed);
  } catch {
    return false;
  }

  if (assetUrl.protocol !== "http:" && assetUrl.protocol !== "https:") return false;

  const base = new URL(normalizeGitlabBaseUrlForServerRequestsV1(gitlabBaseUrl));
  if (assetUrl.origin !== base.origin) return false;

  const p = assetUrl.pathname.toLowerCase();
  return p.includes("/uploads/");
}
