import { createHash } from "node:crypto";

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

function basenameFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

/** Só server: usa `node:crypto`. Cliente deve importar só o helper de URL em `…-is-valid-for-serve-v1`. */
export function wishGitlabDescriptionUploadedAssetFileNameFromAbsoluteUrlV1(
  absoluteUrl: string,
): string | null {
  try {
    const u = new URL(absoluteUrl);
    const base = basenameFromPathname(u.pathname);
    const extMatch = base.match(/\.([a-zA-Z0-9]+)$/);
    const extRaw = extMatch?.[1]?.toLowerCase() ?? "png";
    const ext = ALLOWED_EXTENSIONS.has(extRaw) ? extRaw : "png";
    const hash = createHash("sha256").update(absoluteUrl).digest("hex");
    return `${hash}.${ext}`;
  } catch {
    return null;
  }
}
