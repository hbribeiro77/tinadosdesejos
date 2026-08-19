import { describe, expect, it } from "vitest";
import {
  wishAppAccessGateAuthorizationBearerMatchesImportApiKeyEdgeSafeV1,
  wishAppAccessGatePathAllowsImportBearerWithoutSessionCookieV1,
} from "@/lib/wish-app-access-gate-path-allows-import-bearer-without-session-cookie-v1";

describe("wishAppAccessGatePathAllowsImportBearerWithoutSessionCookieV1", () => {
  it("libera GET/PUT board, PUT assets e POST presence-check", () => {
    expect(
      wishAppAccessGatePathAllowsImportBearerWithoutSessionCookieV1({
        pathname: "/api/wish-kanban-board/persisted-v1",
        method: "GET",
      }),
    ).toBe(true);
    expect(
      wishAppAccessGatePathAllowsImportBearerWithoutSessionCookieV1({
        pathname: "/api/wish-kanban-board/description-uploaded-assets-presence-check-v1",
        method: "POST",
      }),
    ).toBe(true);
    expect(
      wishAppAccessGatePathAllowsImportBearerWithoutSessionCookieV1({
        pathname: "/api/health",
        method: "GET",
      }),
    ).toBe(false);
  });
});

describe("wishAppAccessGateAuthorizationBearerMatchesImportApiKeyEdgeSafeV1", () => {
  it("aceita Bearer correto e rejeita errado", () => {
    expect(
      wishAppAccessGateAuthorizationBearerMatchesImportApiKeyEdgeSafeV1("Bearer secret", "secret"),
    ).toBe(true);
    expect(
      wishAppAccessGateAuthorizationBearerMatchesImportApiKeyEdgeSafeV1("Bearer wrong", "secret"),
    ).toBe(false);
  });
});
