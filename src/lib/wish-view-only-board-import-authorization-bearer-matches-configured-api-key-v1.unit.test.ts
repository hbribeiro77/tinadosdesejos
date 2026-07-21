import { describe, expect, it } from "vitest";
import {
  wishViewOnlyBoardImportAuthorizationBearerMatchesConfiguredApiKeyV1,
  wishViewOnlyBoardImportParseBearerTokenFromAuthorizationHeaderV1,
} from "@/lib/wish-view-only-board-import-authorization-bearer-matches-configured-api-key-v1";

describe("wishViewOnlyBoardImportParseBearerTokenFromAuthorizationHeaderV1", () => {
  it("extrai token Bearer", () => {
    expect(wishViewOnlyBoardImportParseBearerTokenFromAuthorizationHeaderV1("Bearer secret-key")).toBe(
      "secret-key",
    );
    expect(wishViewOnlyBoardImportParseBearerTokenFromAuthorizationHeaderV1("bearer secret-key")).toBe(
      "secret-key",
    );
  });

  it("retorna null para header inválido ou ausente", () => {
    expect(wishViewOnlyBoardImportParseBearerTokenFromAuthorizationHeaderV1(null)).toBeNull();
    expect(wishViewOnlyBoardImportParseBearerTokenFromAuthorizationHeaderV1("Basic abc")).toBeNull();
    expect(wishViewOnlyBoardImportParseBearerTokenFromAuthorizationHeaderV1("Bearer")).toBeNull();
  });
});

describe("wishViewOnlyBoardImportAuthorizationBearerMatchesConfiguredApiKeyV1", () => {
  it("aceita match exato", () => {
    expect(
      wishViewOnlyBoardImportAuthorizationBearerMatchesConfiguredApiKeyV1("Bearer my-secret", "my-secret"),
    ).toBe(true);
  });

  it("rejeita mismatch, header ausente e key vazia", () => {
    expect(
      wishViewOnlyBoardImportAuthorizationBearerMatchesConfiguredApiKeyV1("Bearer wrong", "my-secret"),
    ).toBe(false);
    expect(wishViewOnlyBoardImportAuthorizationBearerMatchesConfiguredApiKeyV1(null, "my-secret")).toBe(
      false,
    );
    expect(wishViewOnlyBoardImportAuthorizationBearerMatchesConfiguredApiKeyV1("Bearer x", "")).toBe(false);
    expect(
      wishViewOnlyBoardImportAuthorizationBearerMatchesConfiguredApiKeyV1("Bearer my-secret", "my-secre"),
    ).toBe(false);
  });
});
