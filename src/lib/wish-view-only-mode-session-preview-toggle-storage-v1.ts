export const WISH_VIEW_ONLY_MODE_SESSION_PREVIEW_STORAGE_KEY_V1 =
  "wish-view-only-mode-session-preview-toggle-v1";

export function wishViewOnlyModeReadSessionPreviewToggleFromStorageV1(
  storage: Pick<Storage, "getItem"> | null | undefined = typeof sessionStorage !== "undefined" ? sessionStorage : null,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(WISH_VIEW_ONLY_MODE_SESSION_PREVIEW_STORAGE_KEY_V1) === "1";
  } catch {
    return false;
  }
}

export function wishViewOnlyModeWriteSessionPreviewToggleToStorageV1(
  enabled: boolean,
  storage: Pick<Storage, "setItem" | "removeItem"> | null | undefined = typeof sessionStorage !== "undefined"
    ? sessionStorage
    : null,
): void {
  if (!storage) return;
  try {
    if (enabled) {
      storage.setItem(WISH_VIEW_ONLY_MODE_SESSION_PREVIEW_STORAGE_KEY_V1, "1");
    } else {
      storage.removeItem(WISH_VIEW_ONLY_MODE_SESSION_PREVIEW_STORAGE_KEY_V1);
    }
  } catch {
    // sessionStorage indisponível (modo privado / quota) — ignora
  }
}
