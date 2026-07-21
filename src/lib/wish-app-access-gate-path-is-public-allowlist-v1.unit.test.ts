import { describe, expect, it } from "vitest";
import { wishAppAccessGatePathIsPublicAllowlistV1 } from "@/lib/wish-app-access-gate-path-is-public-allowlist-v1";

describe("wishAppAccessGatePathIsPublicAllowlistV1", () => {
  it("libera allowlist e bloqueia o resto", () => {
    expect(wishAppAccessGatePathIsPublicAllowlistV1("/entrar")).toBe(true);
    expect(wishAppAccessGatePathIsPublicAllowlistV1("/api/health")).toBe(true);
    expect(wishAppAccessGatePathIsPublicAllowlistV1("/api/wish-app-access-gate-v1")).toBe(true);
    expect(wishAppAccessGatePathIsPublicAllowlistV1("/api/wish-app-runtime-flags-v1")).toBe(true);
    expect(wishAppAccessGatePathIsPublicAllowlistV1("/_next/static/chunk.js")).toBe(true);
    expect(wishAppAccessGatePathIsPublicAllowlistV1("/")).toBe(false);
    expect(wishAppAccessGatePathIsPublicAllowlistV1("/api/wish-kanban-board/persisted-v1")).toBe(
      false,
    );
  });
});
