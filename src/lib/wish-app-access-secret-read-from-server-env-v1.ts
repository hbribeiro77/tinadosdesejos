/** Lê `WISH_APP_ACCESS_SECRET` (trim); string vazia se ausente. */
export function wishAppAccessSecretReadFromServerEnvV1(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const raw = env.WISH_APP_ACCESS_SECRET;
  if (typeof raw !== "string") return "";
  return raw.trim();
}
