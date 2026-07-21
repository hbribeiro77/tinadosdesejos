import { normalizeGitlabBaseUrlForServerRequestsV1 } from "@/lib/normalize-gitlab-base-url-for-server-requests-v1";

/** Caminhos de upload do GitLab que o proxy pode buscar com token do servidor. */
export function gitlabMarkdownUploadAssetUrlPathnameIsAllowedForServerProxyV1(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return p.includes("/uploads/");
}

export function gitlabMarkdownUploadAssetAbsoluteUrlIsAllowedForServerProxyV1(
  rawUrl: string,
  gitlabBaseUrl: string,
): boolean {
  const trimmed = typeof rawUrl === "string" ? rawUrl.trim() : "";
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

  return gitlabMarkdownUploadAssetUrlPathnameIsAllowedForServerProxyV1(assetUrl.pathname);
}
