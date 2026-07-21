import { createHash } from "node:crypto";
import path from "node:path";

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

export function wishGitlabDescriptionUploadedAssetFileNameFromAbsoluteUrlV1(
  absoluteUrl: string,
): string | null {
  try {
    const u = new URL(absoluteUrl);
    const base = path.basename(u.pathname);
    const extMatch = base.match(/\.([a-zA-Z0-9]+)$/);
    const extRaw = extMatch?.[1]?.toLowerCase() ?? "png";
    const ext = ALLOWED_EXTENSIONS.has(extRaw) ? extRaw : "png";
    const hash = createHash("sha256").update(absoluteUrl).digest("hex");
    return `${hash}.${ext}`;
  } catch {
    return null;
  }
}

export function wishGitlabDescriptionUploadedAssetLocalServeUrlFromFileNameV1(fileName: string): string {
  return `/api/wish-kanban-board/gitlab-description-uploaded-asset-v1/${fileName}`;
}
