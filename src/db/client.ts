import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import * as schema from "./schema";

// Ensure data directory exists or sqlite3 will create it in CWD, but it's better to be explicit.
// In Next.js, process.cwd() is the project root.
const dbPath = path.join(process.cwd(), "data", "triage.db");

// create the directory if it doesn't exist
import fs from "fs";
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
