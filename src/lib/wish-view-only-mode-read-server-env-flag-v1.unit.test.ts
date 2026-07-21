import { describe, expect, it } from "vitest";
import { wishViewOnlyModeReadServerEnvFlagV1 } from "@/lib/wish-view-only-mode-read-server-env-flag-v1";

describe("wishViewOnlyModeReadServerEnvFlagV1", () => {
  it("retorna true só quando WISH_VIEW_ONLY_MODE=1", () => {
    expect(wishViewOnlyModeReadServerEnvFlagV1({ WISH_VIEW_ONLY_MODE: "1" })).toBe(true);
    expect(wishViewOnlyModeReadServerEnvFlagV1({ WISH_VIEW_ONLY_MODE: "0" })).toBe(false);
    expect(wishViewOnlyModeReadServerEnvFlagV1({ WISH_VIEW_ONLY_MODE: "true" })).toBe(false);
    expect(wishViewOnlyModeReadServerEnvFlagV1({})).toBe(false);
  });
});
