import { z } from "zod";
import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";

const smartTaskSubtaskRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

const smartTaskTaskRowSchema = z.object({
  id: z.string().min(1, "id não pode ser vazio"),
  title: z.string(),
  description: z.string(),
  due_date: z.union([z.string(), z.null()]),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  tags: z.array(z.string()),
  subtasks: z.array(smartTaskSubtaskRowSchema),
  status: z.enum(["active", "completed", "archived"]),
  focus_of_day: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.union([z.string(), z.null()]),
});

const backupFileV1EnvelopeSchema = z.object({
  version: z.literal(1),
  exported_at: z.string(),
  tasks: z.array(smartTaskTaskRowSchema),
});

function normalizeTaskRow(row: z.infer<typeof smartTaskTaskRowSchema>): SmartTaskNormalizedTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    priority: row.priority,
    tags: row.tags,
    subtasks: row.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
    })),
    status: row.status,
    focusOfDay: row.focus_of_day,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function formatZodErrorForUser(err: z.ZodError): string {
  const first = err.issues[0];
  if (!first) return "JSON inválido: estrutura não reconhecida.";
  const path = first.path.length ? `${first.path.join(".")}: ` : "";
  return `JSON inválido: ${path}${first.message}`;
}

export type ParseSmartTaskBackupJsonTextResult =
  | { ok: true; exportedAt: string | null; tasks: SmartTaskNormalizedTask[] }
  | { ok: false; message: string };

export function parseSmartTaskBackupJsonTextValidateWithZodAndNormalizeTasks(
  rawJsonText: string,
): ParseSmartTaskBackupJsonTextResult {
  let root: unknown;
  try {
    root = JSON.parse(rawJsonText);
  } catch {
    return { ok: false, message: "JSON inválido: não foi possível interpretar o texto." };
  }

  if (Array.isArray(root)) {
    const r = z.array(smartTaskTaskRowSchema).safeParse(root);
    if (!r.success) return { ok: false, message: formatZodErrorForUser(r.error) };
    return {
      ok: true,
      exportedAt: null,
      tasks: r.data.map(normalizeTaskRow),
    };
  }

  const env = backupFileV1EnvelopeSchema.safeParse(root);
  if (!env.success) {
    return { ok: false, message: formatZodErrorForUser(env.error) };
  }

  return {
    ok: true,
    exportedAt: env.data.exported_at,
    tasks: env.data.tasks.map(normalizeTaskRow),
  };
}
