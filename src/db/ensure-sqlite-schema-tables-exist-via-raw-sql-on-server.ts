import type Database from "better-sqlite3";

/**
 * Garante tabelas no `data/triage.db` sem depender de migrações Drizzle aplicadas manualmente.
 * Idempotente (`CREATE TABLE IF NOT EXISTS`).
 */
export function ensureSqliteSchemaTablesExistViaRawSqlOnServer(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS triage_history (
      id TEXT PRIMARY KEY NOT NULL,
      issue_url TEXT NOT NULL,
      issue_title TEXT NOT NULL,
      axis TEXT NOT NULL,
      score INTEGER NOT NULL,
      explanation TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wish_kanban_board_persisted_v1 (
      board_key TEXT PRIMARY KEY NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wish_smart_task_imported_tasks_persisted_v1 (
      storage_key TEXT PRIMARY KEY NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}
