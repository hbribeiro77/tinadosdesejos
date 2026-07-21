import { eq } from "drizzle-orm";
import { getWishSqliteDrizzleDb } from "@/db/client";
import {
  WISH_SMART_TASK_IMPORTED_TASKS_DEFAULT_STORAGE_KEY,
  wishSmartTaskImportedTasksPersistedV1,
} from "@/db/schema";
import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";
import {
  parseWishSmartTaskImportedTasksPayloadV1,
  stringifyWishSmartTaskImportedTasksPayloadV1,
} from "@/lib/wish-smart-task-imported-tasks-local-storage-serialization";

export function readWishSmartTaskImportedTasksPersistedV1FromSqliteForServer(): {
  found: true;
  tasks: SmartTaskNormalizedTask[];
  updatedAt: Date;
} | { found: false } {
  const db = getWishSqliteDrizzleDb();
  const rows = db
    .select()
    .from(wishSmartTaskImportedTasksPersistedV1)
    .where(
      eq(wishSmartTaskImportedTasksPersistedV1.storageKey, WISH_SMART_TASK_IMPORTED_TASKS_DEFAULT_STORAGE_KEY),
    )
    .all();

  const row = rows[0];
  if (!row) return { found: false };

  const payload = parseWishSmartTaskImportedTasksPayloadV1(row.payloadJson);
  if (!payload) return { found: false };

  return { found: true, tasks: payload.tasks, updatedAt: row.updatedAt };
}

export function writeWishSmartTaskImportedTasksPersistedV1ToSqliteForServer(
  tasks: SmartTaskNormalizedTask[],
): Date {
  const now = new Date();
  const payloadJson = stringifyWishSmartTaskImportedTasksPayloadV1(tasks);

  getWishSqliteDrizzleDb()
    .insert(wishSmartTaskImportedTasksPersistedV1)
    .values({
      storageKey: WISH_SMART_TASK_IMPORTED_TASKS_DEFAULT_STORAGE_KEY,
      payloadJson,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: wishSmartTaskImportedTasksPersistedV1.storageKey,
      set: { payloadJson, updatedAt: now },
    })
    .run();

  return now;
}
