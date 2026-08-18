const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]);

/** Limite alinhado a uploads típicos de screenshot na UI. */
export const WISH_GITLAB_PROJECT_UPLOAD_IMAGE_MAX_BYTES_V1 = 12 * 1024 * 1024;

export function wishGitlabProjectUploadImageFileIsAllowedV1(params: {
  mimeType: string;
  byteLength: number;
}): boolean {
  const mime = (params.mimeType || "").toLowerCase().split(";")[0]!.trim();
  if (!ALLOWED_MIME.has(mime)) return false;
  if (!Number.isFinite(params.byteLength) || params.byteLength <= 0) return false;
  if (params.byteLength > WISH_GITLAB_PROJECT_UPLOAD_IMAGE_MAX_BYTES_V1) return false;
  return true;
}

/** Extrai o markdown de `POST .../projects/:id/uploads` (campo `markdown` ou fallback `url`). */
export function wishGitlabProjectUploadParseMarkdownFromUploadApiJsonV1(
  jsonBody: unknown,
): string | null {
  if (!jsonBody || typeof jsonBody !== "object") return null;
  const markdown = (jsonBody as { markdown?: unknown }).markdown;
  if (typeof markdown === "string" && markdown.trim()) {
    return markdown.trim();
  }
  const url = (jsonBody as { url?: unknown }).url;
  if (typeof url === "string" && url.trim()) {
    const u = url.trim();
    return `![image](${u})`;
  }
  return null;
}
