/**
 * Paths liberados sem cookie quando o portão está ativo.
 * Usado pelo middleware (Edge).
 */
export function wishAppAccessGatePathIsPublicAllowlistV1(pathname: string): boolean {
  if (pathname === "/entrar") return true;
  if (pathname === "/api/wish-app-access-gate-v1") return true;
  if (pathname === "/api/wish-app-runtime-flags-v1") return true;
  if (pathname === "/api/health") return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/_next/static")) return true;
  if (pathname.startsWith("/_next/image")) return true;
  return false;
}
