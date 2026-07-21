import { timingSafeEqual } from "node:crypto";

/** Compara o secret informado com o configurado (timing-safe). */
export function wishAppAccessSecretTimingSafeMatchesConfiguredV1(
  providedSecret: string,
  configuredSecret: string,
): boolean {
  const expected = typeof configuredSecret === "string" ? configuredSecret.trim() : "";
  if (!expected) return false;

  const provided = typeof providedSecret === "string" ? providedSecret : "";
  if (!provided) return false;

  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");
  if (expectedBuf.length !== providedBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return timingSafeEqual(expectedBuf, providedBuf);
}
