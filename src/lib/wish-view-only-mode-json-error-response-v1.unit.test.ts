import { afterEach, describe, expect, it } from "vitest";
import {
  WISH_VIEW_ONLY_MODE_ERROR_CODE_V1,
  wishViewOnlyModeBuildJsonErrorBodyV1,
  wishViewOnlyModeRejectIfEnabledAsNextResponseV1,
} from "@/lib/wish-view-only-mode-json-error-response-v1";

describe("wishViewOnlyModeJsonErrorResponseV1", () => {
  const prev = process.env.WISH_VIEW_ONLY_MODE;

  afterEach(() => {
    if (prev === undefined) delete process.env.WISH_VIEW_ONLY_MODE;
    else process.env.WISH_VIEW_ONLY_MODE = prev;
  });

  it("monta body com code view_only_mode", () => {
    const body = wishViewOnlyModeBuildJsonErrorBodyV1();
    expect(body.ok).toBe(false);
    expect(body.code).toBe(WISH_VIEW_ONLY_MODE_ERROR_CODE_V1);
    expect(body.message.length).toBeGreaterThan(0);
  });

  it("reject retorna null quando flag desligada", () => {
    expect(wishViewOnlyModeRejectIfEnabledAsNextResponseV1({ WISH_VIEW_ONLY_MODE: undefined })).toBeNull();
    expect(wishViewOnlyModeRejectIfEnabledAsNextResponseV1({ WISH_VIEW_ONLY_MODE: "0" })).toBeNull();
  });

  it("reject retorna NextResponse 403 quando flag ligada", async () => {
    const res = wishViewOnlyModeRejectIfEnabledAsNextResponseV1({ WISH_VIEW_ONLY_MODE: "1" });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const json = (await res!.json()) as { ok: boolean; code: string };
    expect(json.ok).toBe(false);
    expect(json.code).toBe(WISH_VIEW_ONLY_MODE_ERROR_CODE_V1);
  });
});
