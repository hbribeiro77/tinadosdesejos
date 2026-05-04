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
