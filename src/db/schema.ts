import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const triageHistory = sqliteTable("triage_history", {
  id: text("id").primaryKey(),
  issueUrl: text("issue_url").notNull(),
  issueTitle: text("issue_title").notNull(),
  axis: text("axis").notNull(),
  score: integer("score").notNull(),
  explanation: text("explanation"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const WISH_KANBAN_BOARD_DEFAULT_PERSISTED_KEY = "default" as const;

export const wishKanbanBoardPersistedV1 = sqliteTable("wish_kanban_board_persisted_v1", {
  boardKey: text("board_key").primaryKey(),
  payloadJson: text("payload_json").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const WISH_SMART_TASK_IMPORTED_TASKS_DEFAULT_STORAGE_KEY = "default" as const;

export const wishSmartTaskImportedTasksPersistedV1 = sqliteTable(
  "wish_smart_task_imported_tasks_persisted_v1",
  {
    storageKey: text("storage_key").primaryKey(),
    payloadJson: text("payload_json").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
);
