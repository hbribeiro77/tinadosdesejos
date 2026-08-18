import { NextResponse } from "next/server";
import { wishViewOnlyModeRejectIfEnabledAsNextResponseV1 } from "@/lib/wish-view-only-mode-json-error-response-v1";
import { readWishKanbanBoardPersistedV1FromSqliteForServer } from "@/lib/wish-kanban-board-persisted-v1-sqlite-read-write-for-server";
import { wishProductionViewerPublishIsConfiguredFromServerEnvV1 } from "@/lib/wish-production-viewer-publish-env-read-from-server-v1";
import { wishPublishKanbanBoardToProductionViewerFromLocalServerV1 } from "@/lib/wish-publish-kanban-board-to-production-viewer-from-local-server-v1";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";

/**
 * Publica o quadro do editor local no viewer de produção.
 * Body opcional: `{ board }` — se omitido, lê o SQLite local.
 * Bloqueado em `WISH_VIEW_ONLY_MODE` (só o editor publica).
 */
export async function POST(request: Request) {
  const viewOnlyRejected = wishViewOnlyModeRejectIfEnabledAsNextResponseV1();
  if (viewOnlyRejected) return viewOnlyRejected;

  if (!wishProductionViewerPublishIsConfiguredFromServerEnvV1()) {
    return NextResponse.json(
      {
        ok: false,
        code: "publish_not_configured",
        message:
          "Configure `WISH_PRODUCTION_VIEWER_BASE_URL` e `WISH_PRODUCTION_VIEWER_IMPORT_API_KEY` no .env do editor.",
      },
      { status: 503 },
    );
  }

  let board: WishKanbanBoard | null = null;

  let body: unknown = null;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, code: "invalid_json", message: "Body JSON inválido." },
        { status: 400 },
      );
    }
  }

  if (body && typeof body === "object" && "board" in body) {
    const rawBoard = (body as { board?: unknown }).board;
    if (!rawBoard || typeof rawBoard !== "object") {
      return NextResponse.json(
        { ok: false, code: "invalid_board", message: "`board` inválido." },
        { status: 400 },
      );
    }
    board = rawBoard as WishKanbanBoard;
  } else {
    const fromDb = readWishKanbanBoardPersistedV1FromSqliteForServer();
    if (!fromDb.found) {
      return NextResponse.json(
        {
          ok: false,
          code: "no_local_board",
          message: "Não há quadro salvo no SQLite local para publicar.",
        },
        { status: 404 },
      );
    }
    board = fromDb.board;
  }

  const result = await wishPublishKanbanBoardToProductionViewerFromLocalServerV1({ board });
  if (!result.ok) {
    const status =
      result.code === "publish_not_configured"
        ? 503
        : result.code.startsWith("production_")
          ? 502
          : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
