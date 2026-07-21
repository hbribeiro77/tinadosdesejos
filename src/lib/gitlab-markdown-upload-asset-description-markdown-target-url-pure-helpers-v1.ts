/** Helpers puros para URLs de upload em markdown — seguros para import no cliente. */

export function readGitlabOriginFromIssueWebUrlV1(webUrl: string | null | undefined): string | null {
  const trimmed = typeof webUrl === "string" ? webUrl.trim() : "";
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    return u.origin;
  } catch {
    return null;
  }
}

export function toAbsoluteGitlabUploadAssetUrlFromMarkdownTargetV1(
  relativeOrAbsolute: string,
  gitlabOrigin: string | null,
): string | null {
  const raw = relativeOrAbsolute.trim();
  if (!raw) return null;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  if (!gitlabOrigin) return null;

  if (raw.startsWith("/")) {
    return `${gitlabOrigin}${raw}`;
  }

  return `${gitlabOrigin}/${raw}`;
}

export function gitlabMarkdownUploadAssetAbsoluteUrlIsUploadPathV1(absoluteUrl: string): boolean {
  return absoluteUrl.toLowerCase().includes("/uploads/");
}
