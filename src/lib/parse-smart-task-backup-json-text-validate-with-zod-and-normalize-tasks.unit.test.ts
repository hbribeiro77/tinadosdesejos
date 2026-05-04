import { describe, expect, it } from "vitest";
import { parseSmartTaskBackupJsonTextValidateWithZodAndNormalizeTasks } from "@/lib/parse-smart-task-backup-json-text-validate-with-zod-and-normalize-tasks";

const minimalTask = {
  id: "t1",
  title: "Uma",
  description: "",
  due_date: null,
  priority: 2,
  tags: [],
  subtasks: [],
  status: "active" as const,
  focus_of_day: false,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
  archived_at: null,
};

describe("parseSmartTaskBackupJsonTextValidateWithZodAndNormalizeTasks", () => {
  it("aceita BackupFileV1", () => {
    const raw = JSON.stringify({
      version: 1,
      exported_at: "2026-01-01T12:00:00.000Z",
      tasks: [minimalTask],
    });
    const r = parseSmartTaskBackupJsonTextValidateWithZodAndNormalizeTasks(raw);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.exportedAt).toBe("2026-01-01T12:00:00.000Z");
    expect(r.tasks).toHaveLength(1);
    expect(r.tasks[0]!.id).toBe("t1");
    expect(r.tasks[0]!.focusOfDay).toBe(false);
  });

  it("aceita array legado no topo", () => {
    const raw = JSON.stringify([minimalTask]);
    const r = parseSmartTaskBackupJsonTextValidateWithZodAndNormalizeTasks(raw);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.exportedAt).toBeNull();
    expect(r.tasks).toHaveLength(1);
  });

  it("rejeita JSON quebrado", () => {
    const r = parseSmartTaskBackupJsonTextValidateWithZodAndNormalizeTasks("{");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toMatch(/JSON inválido/i);
  });

  it("rejeita envelope sem version 1", () => {
    const raw = JSON.stringify({ version: 2, exported_at: "x", tasks: [] });
    const r = parseSmartTaskBackupJsonTextValidateWithZodAndNormalizeTasks(raw);
    expect(r.ok).toBe(false);
  });
});
