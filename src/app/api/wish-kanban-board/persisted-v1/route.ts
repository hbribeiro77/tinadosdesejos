import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  WishKanbanBoardPersistedV1GetResponseDto,
  WishKanbanBoardPersistedV1PutResponseDto,
} from "@/lib/wish-kanban-board-persisted-v1-api-response-dto-types";
import {
  parseWishKanbanBoardFromPersistedPayloadJsonForServer,
  readWishKanbanBoardPersistedV1FromSqliteForServer,
  writeWishKanbanBoardPersistedV1ToSqliteForServer,
} from "@/lib/wish-kanban-board-persisted-v1-sqlite-read-write-for-server";
import { stringifyWishKanbanBoard } from "@/lib/wish-board-localstorage-serialization";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import {
  isWishSqliteNativeModuleLoadError,
  wishSqliteNativeModuleLoadErrorUserMessagePtBr,
} from "@/db/client";
import { wishKanbanBoardEnrichAllCardsGitlabDescriptionUploadAssetsMirrorOnServerV1 } from "@/lib/wish-kanban-board-enrich-all-cards-gitlab-description-upload-assets-mirror-on-server-v1";
import { wishViewOnlyModeReadServerEnvFlagV1 } from "@/lib/wish-view-only-mode-read-server-env-flag-v1";
import { wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1 } from "@/lib/wish-view-only-board-import-reject-unauthorized-put-as-next-response-v1";

const putBodySchema = z.object({
  board: z.record(z.string(), z.unknown()),
});

export async function GET(): Promise<NextResponse<WishKanbanBoardPersistedV1GetResponseDto>> {
  try {
    const row = readWishKanbanBoardPersistedV1FromSqliteForServer();
    if (!row.found) {
      return NextResponse.json({ ok: true, found: false });
    }

    if (wishViewOnlyModeReadServerEnvFlagV1()) {
      return NextResponse.json({
        ok: true,
        found: true,
        board: row.board,
        updatedAt: row.updatedAt.toISOString(),
      });
    }

    const boardForRead = await wishKanbanBoardEnrichAllCardsGitlabDescriptionUploadAssetsMirrorOnServerV1(row.board);
    if (boardForRead !== row.board) {
      writeWishKanbanBoardPersistedV1ToSqliteForServer(boardForRead);
    }

    const updatedRow = readWishKanbanBoardPersistedV1FromSqliteForServer();
    const board = updatedRow.found ? updatedRow.board : boardForRead;
    const updatedAt = updatedRow.found ? updatedRow.updatedAt : row.updatedAt;

    return NextResponse.json({
      ok: true,
      found: true,
      board,
      updatedAt: updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("wish-kanban-board persisted-v1 GET:", error);
    if (isWishSqliteNativeModuleLoadError(error)) {
      return NextResponse.json(
        { ok: false, code: "sqlite_native", message: wishSqliteNativeModuleLoadErrorUserMessagePtBr() },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, message: "Falha ao ler o quadro no servidor." }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<NextResponse<WishKanbanBoardPersistedV1PutResponseDto>> {
  const importUnauthorized = wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1(request);
  if (importUnauthorized) return importUnauthorized;

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

  const board = parseWishKanbanBoardFromPersistedPayloadJsonForServer(
    stringifyWishKanbanBoard(parsedBody.data.board as WishKanbanBoard),
  );
  if (!board) {
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_board",
        message: "Quadro inválido: esperado `{ version: 1, board: ... }` com estrutura do Tina.",
      },
      { status: 400 },
    );
  }

  try {
    const boardForWrite = wishViewOnlyModeReadServerEnvFlagV1()
      ? board
      : await wishKanbanBoardEnrichAllCardsGitlabDescriptionUploadAssetsMirrorOnServerV1(board);
    const updatedAt = writeWishKanbanBoardPersistedV1ToSqliteForServer(boardForWrite);
    return NextResponse.json({ ok: true, updatedAt: updatedAt.toISOString() });
  } catch (error) {
    console.error("wish-kanban-board persisted-v1 PUT:", error);
    if (isWishSqliteNativeModuleLoadError(error)) {
      return NextResponse.json(
        { ok: false, code: "sqlite_native", message: wishSqliteNativeModuleLoadErrorUserMessagePtBr() },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "Falha ao salvar o quadro no servidor." },
      { status: 500 },
    );
  }
}
