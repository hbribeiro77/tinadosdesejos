export const WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY_SESSION_STORAGE_KEY_V1 =
  "wish-view-only-board-import-api-key-session-v1";

export function wishViewOnlyBoardImportApiKeyReadFromSessionStorageV1(
  storage: Pick<Storage, "getItem"> | null | undefined = typeof sessionStorage !== "undefined"
    ? sessionStorage
    : null,
): string | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY_SESSION_STORAGE_KEY_V1);
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : null;
  } catch {
    return null;
  }
}

export function wishViewOnlyBoardImportApiKeyWriteToSessionStorageV1(
  apiKey: string,
  storage: Pick<Storage, "setItem" | "removeItem"> | null | undefined = typeof sessionStorage !== "undefined"
    ? sessionStorage
    : null,
): void {
  if (!storage) return;
  try {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      storage.removeItem(WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY_SESSION_STORAGE_KEY_V1);
      return;
    }
    storage.setItem(WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY_SESSION_STORAGE_KEY_V1, trimmed);
  } catch {
    // sessionStorage indisponível
  }
}

export function wishViewOnlyBoardImportApiKeyClearFromSessionStorageV1(
  storage: Pick<Storage, "removeItem"> | null | undefined = typeof sessionStorage !== "undefined"
    ? sessionStorage
    : null,
): void {
  if (!storage) return;
  try {
    storage.removeItem(WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY_SESSION_STORAGE_KEY_V1);
  } catch {
    // ignore
  }
}
