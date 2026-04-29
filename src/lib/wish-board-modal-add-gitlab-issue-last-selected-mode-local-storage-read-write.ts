const STORAGE_KEY = "wish-board-modal-add-gitlab-issue-last-mode-v1";

export type WishBoardModalAddGitlabIssueLastSelectedModeV1 = "url" | "create";

export function readWishBoardModalAddGitlabIssueLastSelectedModeFromLocalStorage(): WishBoardModalAddGitlabIssueLastSelectedModeV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "url" || raw === "create") return raw;
    return null;
  } catch {
    return null;
  }
}

export function writeWishBoardModalAddGitlabIssueLastSelectedModeToLocalStorage(
  mode: WishBoardModalAddGitlabIssueLastSelectedModeV1,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore quota */
  }
}
