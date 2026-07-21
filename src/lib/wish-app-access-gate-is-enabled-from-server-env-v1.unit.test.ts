import { describe, expect, it } from "vitest";
import { wishAppAccessGateIsEnabledFromServerEnvV1 } from "@/lib/wish-app-access-gate-is-enabled-from-server-env-v1";
import { wishAppAccessSecretTimingSafeMatchesConfiguredV1 } from "@/lib/wish-app-access-secret-timing-safe-matches-configured-v1";

describe("wishAppAccessGateIsEnabledFromServerEnvV1", () => {
  it("liga só com secret não-vazio", () => {
    expect(wishAppAccessGateIsEnabledFromServerEnvV1({ WISH_APP_ACCESS_SECRET: undefined })).toBe(
      false,
    );
    expect(wishAppAccessGateIsEnabledFromServerEnvV1({ WISH_APP_ACCESS_SECRET: "" })).toBe(false);
    expect(wishAppAccessGateIsEnabledFromServerEnvV1({ WISH_APP_ACCESS_SECRET: "   " })).toBe(false);
    expect(wishAppAccessGateIsEnabledFromServerEnvV1({ WISH_APP_ACCESS_SECRET: "abc" })).toBe(true);
  });
});

describe("wishAppAccessSecretTimingSafeMatchesConfiguredV1", () => {
  it("aceita match e rejeita mismatch / vazio", () => {
    expect(wishAppAccessSecretTimingSafeMatchesConfiguredV1("secret", "secret")).toBe(true);
    expect(wishAppAccessSecretTimingSafeMatchesConfiguredV1("wrong", "secret")).toBe(false);
    expect(wishAppAccessSecretTimingSafeMatchesConfiguredV1("secret", "")).toBe(false);
    expect(wishAppAccessSecretTimingSafeMatchesConfiguredV1("", "secret")).toBe(false);
  });
});
