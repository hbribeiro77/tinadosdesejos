import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import {
  wishProductionViewerBaseUrlReadFromServerEnvV1,
  wishProductionViewerImportApiKeyReadFromServerEnvV1,
} from "@/lib/wish-production-viewer-publish-env-read-from-server-v1";
import { wishKanbanBoardCollectMirroredDescriptionUploadedAssetsBase64FromLocalDataDirectoryOnServerV1 } from "@/lib/wish-kanban-board-collect-mirrored-description-uploaded-assets-base64-from-local-data-directory-on-server-v1";

export type WishPublishKanbanBoardToProductionViewerResultV1 =
  | {
      ok: true;
      assetWrittenCount: number;
      assetSkippedCount: number;
      missingLocalAssetCount: number;
      productionBaseUrl: string;
    }
  | { ok: false; code: string; message: string };

async function putJsonToProductionViewerV1(params: {
  baseUrl: string;
  path: string;
  importApiKey: string;
  body: unknown;
}): Promise<{ ok: true; json: unknown; status: number } | { ok: false; status: number; message: string }> {
  const url = `${params.baseUrl}${params.path}`;
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${params.importApiKey}`,
      },
      body: JSON.stringify(params.body),
      cache: "no-store",
    });
    const text = await response.text();
    let json: unknown = null;
    if (text.trim()) {
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        json = null;
      }
    }
    if (!response.ok) {
      const message =
        json &&
        typeof json === "object" &&
        "message" in json &&
        typeof (json as { message?: unknown }).message === "string"
          ? String((json as { message: string }).message)
          : `HTTP ${response.status} em ${params.path}`;
      return { ok: false, status: response.status, message };
    }
    return { ok: true, json, status: response.status };
  } catch (cause) {
    return {
      ok: false,
      status: 0,
      message: cause instanceof Error ? cause.message : `Falha de rede ao chamar ${params.path}`,
    };
  }
}

/**
 * Publica o quadro (e imagens espelhadas em data/) no viewer de produção via PUT + Bearer.
 * Ordem: assets primeiro, depois o board (URLs no markdown já apontam para assets locais).
 */
export async function wishPublishKanbanBoardToProductionViewerFromLocalServerV1(params: {
  board: WishKanbanBoard;
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
}): Promise<WishPublishKanbanBoardToProductionViewerResultV1> {
  const env = params.env ?? process.env;
  const baseUrl = wishProductionViewerBaseUrlReadFromServerEnvV1(env);
  const importApiKey = wishProductionViewerImportApiKeyReadFromServerEnvV1(env);

  if (!baseUrl || !importApiKey) {
    return {
      ok: false,
      code: "publish_not_configured",
      message:
        "Configure `WISH_PRODUCTION_VIEWER_BASE_URL` e `WISH_PRODUCTION_VIEWER_IMPORT_API_KEY` no editor local.",
    };
  }

  const { assetsBase64ByFileName, missingFileNames } =
    await wishKanbanBoardCollectMirroredDescriptionUploadedAssetsBase64FromLocalDataDirectoryOnServerV1(
      params.board,
    );

  let assetWrittenCount = 0;
  let assetSkippedCount = 0;

  if (Object.keys(assetsBase64ByFileName).length > 0) {
    const assetsPut = await putJsonToProductionViewerV1({
      baseUrl,
      path: "/api/wish-kanban-board/description-uploaded-assets-import-v1",
      importApiKey,
      body: { assetsBase64ByFileName },
    });
    if (!assetsPut.ok) {
      return {
        ok: false,
        code: "production_assets_put_failed",
        message: `Falha ao enviar imagens para produção: ${assetsPut.message}`,
      };
    }
    if (assetsPut.json && typeof assetsPut.json === "object") {
      const j = assetsPut.json as { writtenCount?: unknown; skippedCount?: unknown };
      if (typeof j.writtenCount === "number") assetWrittenCount = j.writtenCount;
      else assetWrittenCount = Object.keys(assetsBase64ByFileName).length;
      if (typeof j.skippedCount === "number") assetSkippedCount = j.skippedCount;
    } else {
      assetWrittenCount = Object.keys(assetsBase64ByFileName).length;
    }
  }

  const boardPut = await putJsonToProductionViewerV1({
    baseUrl,
    path: "/api/wish-kanban-board/persisted-v1",
    importApiKey,
    body: { board: params.board },
  });
  if (!boardPut.ok) {
    return {
      ok: false,
      code: "production_board_put_failed",
      message: `Falha ao enviar o quadro para produção: ${boardPut.message}`,
    };
  }

  return {
    ok: true,
    assetWrittenCount,
    assetSkippedCount,
    missingLocalAssetCount: missingFileNames.length,
    productionBaseUrl: baseUrl,
  };
}
