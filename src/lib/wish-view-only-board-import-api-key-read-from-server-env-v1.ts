/** Lê `WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY` (trim); string vazia se ausente. */
export function wishViewOnlyBoardImportApiKeyReadFromServerEnvV1(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const raw = env.WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY;
  if (typeof raw !== "string") return "";
  return raw.trim();
}
