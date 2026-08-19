import { wishViewOnlyBoardImportApiKeyReadFromServerEnvV1 } from "@/lib/wish-view-only-board-import-api-key-read-from-server-env-v1";

/** Extrai Bearer (puro — seguro para Edge middleware). */
export function wishAppAccessGateParseBearerTokenFromAuthorizationHeaderEdgeSafeV1(
  authorizationHeader: string | null | undefined,
): string | null {
  if (typeof authorizationHeader !== "string") return null;
  const trimmed = authorizationHeader.trim();
  const match = /^Bearer\s+(\S+)$/i.exec(trimmed);
  if (!match) return null;
  const token = match[1]!.trim();
  return token.length ? token : null;
}

/** Comparação timing-safe Edge-safe (sem node:crypto). */
export function wishAppAccessGateTimingSafeEqualUtf8StringsV1(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function wishAppAccessGateAuthorizationBearerMatchesImportApiKeyEdgeSafeV1(
  authorizationHeader: string | null | undefined,
  configuredImportApiKey: string,
): boolean {
  const expected = configuredImportApiKey.trim();
  if (!expected) return false;
  const provided = wishAppAccessGateParseBearerTokenFromAuthorizationHeaderEdgeSafeV1(authorizationHeader);
  if (!provided) return false;
  return wishAppAccessGateTimingSafeEqualUtf8StringsV1(provided, expected);
}

export function wishAppAccessGateImportBearerMatchesConfiguredKeyFromEnvEdgeSafeV1(
  authorizationHeader: string | null | undefined,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const key = wishViewOnlyBoardImportApiKeyReadFromServerEnvV1(env);
  return wishAppAccessGateAuthorizationBearerMatchesImportApiKeyEdgeSafeV1(authorizationHeader, key);
}

/**
 * Rotas que o publish local usa com Bearer da chave de import,
 * sem cookie de `/entrar` — só se o Bearer bater com a key configurada.
 */
export function wishAppAccessGatePathAllowsImportBearerWithoutSessionCookieV1(params: {
  pathname: string;
  method: string;
}): boolean {
  const method = params.method.toUpperCase();
  const { pathname } = params;

  if (pathname === "/api/wish-kanban-board/persisted-v1") {
    return method === "GET" || method === "PUT";
  }
  if (pathname === "/api/wish-kanban-board/description-uploaded-assets-import-v1") {
    return method === "PUT";
  }
  if (pathname === "/api/wish-kanban-board/description-uploaded-assets-presence-check-v1") {
    return method === "POST";
  }
  return false;
}
