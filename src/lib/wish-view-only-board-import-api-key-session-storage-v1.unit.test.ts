import { describe, expect, it } from "vitest";
import {
  WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY_SESSION_STORAGE_KEY_V1,
  wishViewOnlyBoardImportApiKeyClearFromSessionStorageV1,
  wishViewOnlyBoardImportApiKeyReadFromSessionStorageV1,
  wishViewOnlyBoardImportApiKeyWriteToSessionStorageV1,
} from "@/lib/wish-view-only-board-import-api-key-session-storage-v1";

describe("wishViewOnlyBoardImportApiKeySessionStorageV1", () => {
  it("grava, lê e limpa a key", () => {
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

    expect(wishViewOnlyBoardImportApiKeyReadFromSessionStorageV1(storage)).toBeNull();
    wishViewOnlyBoardImportApiKeyWriteToSessionStorageV1("  abc  ", storage);
    expect(map.get(WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY_SESSION_STORAGE_KEY_V1)).toBe("abc");
    expect(wishViewOnlyBoardImportApiKeyReadFromSessionStorageV1(storage)).toBe("abc");
    wishViewOnlyBoardImportApiKeyClearFromSessionStorageV1(storage);
    expect(wishViewOnlyBoardImportApiKeyReadFromSessionStorageV1(storage)).toBeNull();
  });
});
