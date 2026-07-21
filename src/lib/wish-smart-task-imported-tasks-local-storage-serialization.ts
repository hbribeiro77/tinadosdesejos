import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";

const STORAGE_KEY = "wish.smarttask.importedTasks.v1";

export type WishSmartTaskImportedTasksPayloadV1 = {
  version: 1;
  tasks: SmartTaskNormalizedTask[];
};

export function parseWishSmartTaskImportedTasksPayloadV1(
  raw: string,
): WishSmartTaskImportedTasksPayloadV1 | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const version = (parsed as { version?: unknown }).version;
    if (version !== 1) return null;
    const tasks = (parsed as { tasks?: unknown }).tasks;
    if (!Array.isArray(tasks)) return null;
    return parsed as WishSmartTaskImportedTasksPayloadV1;
  } catch {
    return null;
  }
}

export function stringifyWishSmartTaskImportedTasksPayloadV1(tasks: SmartTaskNormalizedTask[]): string {
  const payload: WishSmartTaskImportedTasksPayloadV1 = { version: 1, tasks };
  return JSON.stringify(payload);
}

export function readWishSmartTaskImportedTasksFromLocalStorage(): SmartTaskNormalizedTask[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseWishSmartTaskImportedTasksPayloadV1(raw)?.tasks ?? null;
  } catch {
    return null;
  }
}

export function writeWishSmartTaskImportedTasksToLocalStorage(tasks: SmartTaskNormalizedTask[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, stringifyWishSmartTaskImportedTasksPayloadV1(tasks));
}

/** Remove cópia legada do navegador após migração/import bem-sucedidos no SQLite. */
export function clearWishSmartTaskImportedTasksFromLocalStorageAfterSqliteMigrationV1(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
