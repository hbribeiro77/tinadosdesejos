/** `WISH_VIEW_ONLY_MODE=1` no servidor: trava autoritativa (APIs + UI definitiva). */
export function wishViewOnlyModeReadServerEnvFlagV1(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.WISH_VIEW_ONLY_MODE === "1";
}
