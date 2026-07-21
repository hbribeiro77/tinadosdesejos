import { timingSafeEqual } from "node:crypto";

/** Extrai o token de `Authorization: Bearer <token>` (case-insensitive no scheme). */
export function wishViewOnlyBoardImportParseBearerTokenFromAuthorizationHeaderV1(
  authorizationHeader: string | null | undefined,
): string | null {
  if (typeof authorizationHeader !== "string") return null;
  const trimmed = authorizationHeader.trim();
  const match = /^Bearer\s+(\S+)$/i.exec(trimmed);
  if (!match) return null;
  const token = match[1]!.trim();
  return token.length ? token : null;
}

/**
 * Compara o Bearer do request com a key configurada (timing-safe).
 * Retorna false se qualquer lado estiver vazio ou os buffers tiverem tamanhos diferentes
 * (ainda assim executa compare em buffer de mesmo tamanho quando possível).
 */
export function wishViewOnlyBoardImportAuthorizationBearerMatchesConfiguredApiKeyV1(
  authorizationHeader: string | null | undefined,
  configuredApiKey: string,
): boolean {
  const expected = typeof configuredApiKey === "string" ? configuredApiKey.trim() : "";
  if (!expected) return false;

  const provided = wishViewOnlyBoardImportParseBearerTokenFromAuthorizationHeaderV1(authorizationHeader);
  if (!provided) return false;

  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");
  if (expectedBuf.length !== providedBuf.length) {
    // Evita short-circuit óbvio de timing por length: compara contra cópia do expected.
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return timingSafeEqual(expectedBuf, providedBuf);
}
