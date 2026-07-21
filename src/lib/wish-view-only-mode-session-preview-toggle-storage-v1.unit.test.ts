import { describe, expect, it } from "vitest";
import {
  WISH_VIEW_ONLY_MODE_SESSION_PREVIEW_STORAGE_KEY_V1,
  wishViewOnlyModeReadSessionPreviewToggleFromStorageV1,
  wishViewOnlyModeWriteSessionPreviewToggleToStorageV1,
} from "@/lib/wish-view-only-mode-session-preview-toggle-storage-v1";

describe("wishViewOnlyModeSessionPreviewToggleStorageV1", () => {
  it("lê e grava a prévia no storage mock", () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
      removeItem: (k: string) => {
        map.delete(k);
      },
    };

    expect(wishViewOnlyModeReadSessionPreviewToggleFromStorageV1(storage)).toBe(false);

    wishViewOnlyModeWriteSessionPreviewToggleToStorageV1(true, storage);
    expect(map.get(WISH_VIEW_ONLY_MODE_SESSION_PREVIEW_STORAGE_KEY_V1)).toBe("1");
    expect(wishViewOnlyModeReadSessionPreviewToggleFromStorageV1(storage)).toBe(true);

    wishViewOnlyModeWriteSessionPreviewToggleToStorageV1(false, storage);
    expect(map.has(WISH_VIEW_ONLY_MODE_SESSION_PREVIEW_STORAGE_KEY_V1)).toBe(false);
    expect(wishViewOnlyModeReadSessionPreviewToggleFromStorageV1(storage)).toBe(false);
  });

  it("tolera storage nulo", () => {
    expect(wishViewOnlyModeReadSessionPreviewToggleFromStorageV1(null)).toBe(false);
    expect(() => wishViewOnlyModeWriteSessionPreviewToggleToStorageV1(true, null)).not.toThrow();
  });
});
