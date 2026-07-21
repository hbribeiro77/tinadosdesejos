import { createRequire } from "node:module";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "./schema";
import { ensureSqliteSchemaTablesExistViaRawSqlOnServer } from "./ensure-sqlite-schema-tables-exist-via-raw-sql-on-server";

const requireBetterSqlite3 = createRequire(import.meta.url);

// Em smoke tests: `WISH_SQLITE_DATABASE_PATH` aponta para um arquivo isolado (ex.: `data/smoke-triage.db`).
const dbPath = process.env.WISH_SQLITE_DATABASE_PATH?.trim()
  ? path.resolve(process.env.WISH_SQLITE_DATABASE_PATH.trim())
  : path.join(process.cwd(), "data", "triage.db");

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let sqliteDatabase: Database.Database | null = null;
let drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqliteInitError: Error | null = null;

export function isWishSqliteNativeModuleLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message;
  return (
    msg.includes("ERR_DLOPEN_FAILED") ||
    msg.includes("NODE_MODULE_VERSION") ||
    msg.includes("was compiled against a different Node.js version") ||
    msg.includes("better_sqlite3.node")
  );
}

export function wishSqliteNativeModuleLoadErrorUserMessagePtBr(): string {
  return (
    `O SQLite nativo (better-sqlite3) não bate com este Node (modules=${process.versions.modules}, ${process.version}). ` +
    "Pare o servidor, rode `npm run ensure:sqlite` e depois `npm run dev` no MESMO terminal."
  );
}

function openBetterSqlite3Database(filePath: string): Database.Database {
  const BetterSqlite3 = requireBetterSqlite3("better-sqlite3") as typeof import("better-sqlite3");
  return new BetterSqlite3(filePath);
}

/**
 * Inicialização tardia: evita derrubar o processo Next na importação do módulo
 * e permite resposta JSON clara se o binário nativo estiver errado.
 */
export function getWishSqliteDrizzleDb() {
  if (drizzleDb) return drizzleDb;
  if (sqliteInitError) throw sqliteInitError;

  try {
    sqliteDatabase = openBetterSqlite3Database(dbPath);
    ensureSqliteSchemaTablesExistViaRawSqlOnServer(sqliteDatabase);
    drizzleDb = drizzle(sqliteDatabase, { schema });
    return drizzleDb;
  } catch (error) {
    sqliteInitError = error instanceof Error ? error : new Error(String(error));
    throw sqliteInitError;
  }
}

/** @deprecated Preferir `getWishSqliteDrizzleDb()` — mantido para rotas antigas. */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getWishSqliteDrizzleDb() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});
