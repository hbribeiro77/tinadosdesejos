/** Base URL do viewer de produção (sem barra final). Vazio = publish desligado. */
export function wishProductionViewerBaseUrlReadFromServerEnvV1(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const raw = env.WISH_PRODUCTION_VIEWER_BASE_URL;
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\/+$/, "");
}

/** Chave Bearer igual à `WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY` do viewer. */
export function wishProductionViewerImportApiKeyReadFromServerEnvV1(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const raw = env.WISH_PRODUCTION_VIEWER_IMPORT_API_KEY;
  if (typeof raw !== "string") return "";
  return raw.trim();
}

/** Editor local com URL + chave configuradas (e não em view-only). */
export function wishProductionViewerPublishIsConfiguredFromServerEnvV1(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return (
    wishProductionViewerBaseUrlReadFromServerEnvV1(env).length > 0 &&
    wishProductionViewerImportApiKeyReadFromServerEnvV1(env).length > 0
  );
}
