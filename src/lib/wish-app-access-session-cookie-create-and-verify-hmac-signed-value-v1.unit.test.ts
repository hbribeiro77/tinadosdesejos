import { describe, expect, it } from "vitest";
import {
  wishAppAccessSessionCookieCreateSignedValueV1,
  wishAppAccessSessionCookieVerifySignedValueV1,
} from "@/lib/wish-app-access-session-cookie-create-and-verify-hmac-signed-value-v1";

describe("wishAppAccessSessionCookieCreateAndVerifyHmacSignedValueV1", () => {
  const secret = "test-access-secret-long-enough";

  it("cria cookie verificável e rejeita expirado / assinatura errada / secret errado", async () => {
    const now = 1_700_000_000;
    const value = await wishAppAccessSessionCookieCreateSignedValueV1(secret, {
      nowUnixSeconds: now,
      ttlSeconds: 3600,
    });
    expect(value).toMatch(/^\d+\.[a-f0-9]{64}$/);

    await expect(
      wishAppAccessSessionCookieVerifySignedValueV1(value, secret, { nowUnixSeconds: now + 10 }),
    ).resolves.toBe(true);

    await expect(
      wishAppAccessSessionCookieVerifySignedValueV1(value, secret, { nowUnixSeconds: now + 4000 }),
    ).resolves.toBe(false);

    await expect(
      wishAppAccessSessionCookieVerifySignedValueV1(value, "other-secret", { nowUnixSeconds: now }),
    ).resolves.toBe(false);

    const tampered = value.replace(/[a-f0-9]$/i, (c) => (c === "0" ? "1" : "0"));
    await expect(
      wishAppAccessSessionCookieVerifySignedValueV1(tampered, secret, { nowUnixSeconds: now }),
    ).resolves.toBe(false);
  });

  it("rejeita cookie vazio ou malformado", async () => {
    await expect(wishAppAccessSessionCookieVerifySignedValueV1("", secret)).resolves.toBe(false);
    await expect(wishAppAccessSessionCookieVerifySignedValueV1("not-a-cookie", secret)).resolves.toBe(
      false,
    );
    await expect(wishAppAccessSessionCookieVerifySignedValueV1(null, "")).resolves.toBe(false);
  });
});
