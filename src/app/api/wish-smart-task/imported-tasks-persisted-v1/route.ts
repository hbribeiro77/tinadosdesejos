import { NextResponse } from "next/server";
import { z } from "zod";
import type { WishSmartTaskImportedTasksPersistedV1PutResponseDto } from "@/lib/wish-smart-task-imported-tasks-persisted-v1-api-response-dto-types";
import type { WishSmartTaskImportedTasksPersistedV1GetResponseDto } from "@/lib/wish-smart-task-imported-tasks-persisted-v1-api-response-dto-types";
import {
  readWishSmartTaskImportedTasksPersistedV1FromSqliteForServer,
  writeWishSmartTaskImportedTasksPersistedV1ToSqliteForServer,
} from "@/lib/wish-smart-task-imported-tasks-persisted-v1-sqlite-read-write-for-server";
import { parseWishSmartTaskImportedTasksPayloadV1 } from "@/lib/wish-smart-task-imported-tasks-local-storage-serialization";
import { stringifyWishSmartTaskImportedTasksPayloadV1 } from "@/lib/wish-smart-task-imported-tasks-local-storage-serialization";
import {
  isWishSqliteNativeModuleLoadError,
  wishSqliteNativeModuleLoadErrorUserMessagePtBr,
} from "@/db/client";
import { wishViewOnlyModeRejectIfEnabledAsNextResponseV1 } from "@/lib/wish-view-only-mode-json-error-response-v1";

const putBodySchema = z.object({
  tasks: z.array(z.record(z.string(), z.unknown())),
});

export async function GET(): Promise<NextResponse<WishSmartTaskImportedTasksPersistedV1GetResponseDto>> {
  try {
    const row = readWishSmartTaskImportedTasksPersistedV1FromSqliteForServer();
    if (!row.found) {
      return NextResponse.json({ ok: true, found: false });
    }
    return NextResponse.json({
      ok: true,
      found: true,
      tasks: row.tasks,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("wish-smart-task imported-tasks-persisted-v1 GET:", error);
    if (isWishSqliteNativeModuleLoadError(error)) {
      return NextResponse.json(
        { ok: false, code: "sqlite_native", message: wishSqliteNativeModuleLoadErrorUserMessagePtBr() },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "Falha ao ler tarefas SmartTask no servidor." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request): Promise<NextResponse<WishSmartTaskImportedTasksPersistedV1PutResponseDto>> {
  const viewOnlyRejected = wishViewOnlyModeRejectIfEnabledAsNextResponseV1();
  if (viewOnlyRejected) return viewOnlyRejected;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_json", message: "Body JSON inválido." },
      { status: 400 },
    );
  }

  const parsedBody = putBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_body",
        message: parsedBody.error.issues.map((i) => i.message).join("; ") || "Body inválido.",
      },
      { status: 400 },
    );
  }

  const payload = parseWishSmartTaskImportedTasksPayloadV1(
    stringifyWishSmartTaskImportedTasksPayloadV1(parsedBody.data.tasks as never),
  );
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_tasks",
        message: "Lista SmartTask inválida.",
      },
      { status: 400 },
    );
  }

  try {
    const updatedAt = writeWishSmartTaskImportedTasksPersistedV1ToSqliteForServer(payload.tasks);
    return NextResponse.json({ ok: true, updatedAt: updatedAt.toISOString() });
  } catch (error) {
    console.error("wish-smart-task imported-tasks-persisted-v1 PUT:", error);
    if (isWishSqliteNativeModuleLoadError(error)) {
      return NextResponse.json(
        { ok: false, code: "sqlite_native", message: wishSqliteNativeModuleLoadErrorUserMessagePtBr() },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "Falha ao salvar tarefas SmartTask no servidor." },
      { status: 500 },
    );
  }
}
