const STORAGE_KEY = "wish-gitlab-drawer-import-labels-csv-v1";

export function readWishGitlabDrawerImportLabelsCsvFromLocalStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null || typeof raw !== "string") return null;
    const t = raw.trim();
    return t.length ? raw : null;
  } catch {
    return null;
  }
}

export function writeWishGitlabDrawerImportLabelsCsvToLocalStorage(csv: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, csv);
  } catch {
    /* ignore quota */
  }
}
