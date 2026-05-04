import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";

const STORAGE_KEY = "wish.smarttask.importedTasks.v1";

export type WishSmartTaskImportedTasksPayloadV1 = {
  version: 1;
  tasks: SmartTaskNormalizedTask[];
};

export function readWishSmartTaskImportedTasksFromLocalStorage(): SmartTaskNormalizedTask[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WishSmartTaskImportedTasksPayloadV1;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.tasks)) return null;
    return parsed.tasks;
  } catch {
    return null;
  }
}

export function writeWishSmartTaskImportedTasksToLocalStorage(tasks: SmartTaskNormalizedTask[]): void {
  if (typeof window === "undefined") return;
  const payload: WishSmartTaskImportedTasksPayloadV1 = { version: 1, tasks };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
