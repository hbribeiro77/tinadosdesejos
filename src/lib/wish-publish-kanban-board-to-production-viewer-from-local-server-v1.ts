import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import type { WishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1 } from "@/lib/wish-kanban-board-diff-local-versus-remote-for-production-publish-preview-v1";
import { wishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1 } from "@/lib/wish-kanban-board-diff-local-versus-remote-for-production-publish-preview-v1";
import { wishKanbanBoardCollectMirroredDescriptionUploadedAssetFileNamesFromBoardMarkdownV1 } from "@/lib/wish-kanban-board-collect-mirrored-description-uploaded-asset-file-names-from-board-markdown-v1";
import {
  wishProductionViewerBaseUrlReadFromServerEnvV1,
  wishProductionViewerImportApiKeyReadFromServerEnvV1,
} from "@/lib/wish-production-viewer-publish-env-read-from-server-v1";
import { wishKanbanBoardCollectMirroredDescriptionUploadedAssetsBase64FromLocalDataDirectoryOnServerV1 } from "@/lib/wish-kanban-board-collect-mirrored-description-uploaded-assets-base64-from-local-data-directory-on-server-v1";

export type WishPublishKanbanBoardToProductionViewerResultV1 =
  | {
      ok: true;
      assetWrittenCount: number;
      assetSkippedAlreadyOnRemoteCount: number;
      assetSkippedInvalidCount: number;
      missingLocalAssetCount: number;
      productionBaseUrl: string;
    }
  | { ok: false; code: string; message: string };

export type WishPublishKanbanBoardToProductionViewerPreviewResultV1 =
  | {
      ok: true;
      productionBaseUrl: string;
      boardDiff: WishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1;
      localAssetCount: number;
      assetsAlreadyOnRemoteCount: number;
      assetsToUploadCount: number;
      missingLocalAssetCount: number;
      confirmMessagePtBr: string;
    }
  | { ok: false; code: string; message: string };

async function fetchJsonFromProductionViewerV1(params: {
  baseUrl: string;
  path: string;
  method: "GET" | "PUT" | "POST";
  importApiKey: string;
  body?: unknown;
}): Promise<{ ok: true; json: unknown; status: number } | { ok: false; status: number; message: string }> {
  const url = `${params.baseUrl}${params.path}`;
  try {
    const response = await fetch(url, {
      method: params.method,
      headers: {
        ...(params.body !== undefined ? { "content-type": "application/json" } : {}),
        Authorization: `Bearer ${params.importApiKey}`,
      },
      body: params.body !== undefined ? JSON.stringify(params.body) : undefined,
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

function readProductionEnvOrError(env: NodeJS.ProcessEnv | Record<string, string | undefined>):
  | { ok: true; baseUrl: string; importApiKey: string }
  | { ok: false; code: string; message: string } {
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
  return { ok: true, baseUrl, importApiKey };
}

async function fetchRemoteBoardOrNull(params: {
  baseUrl: string;
  importApiKey: string;
}): Promise<{ ok: true; board: WishKanbanBoard | null } | { ok: false; message: string }> {
  const remoteGet = await fetchJsonFromProductionViewerV1({
    baseUrl: params.baseUrl,
    path: "/api/wish-kanban-board/persisted-v1",
    method: "GET",
    importApiKey: params.importApiKey,
  });
  if (!remoteGet.ok) {
    return { ok: false, message: remoteGet.message };
  }
  const json = remoteGet.json;
  if (!json || typeof json !== "object" || !("ok" in json) || (json as { ok?: unknown }).ok !== true) {
    return { ok: false, message: "Resposta inválida ao ler o quadro da VPS." };
  }
  const found = (json as { found?: unknown }).found === true;
  if (!found) return { ok: true, board: null };
  const board = (json as { board?: unknown }).board;
  if (!board || typeof board !== "object") {
    return { ok: false, message: "Quadro remoto inválido." };
  }
  return { ok: true, board: board as WishKanbanBoard };
}

async function checkRemoteAssetPresenceV1(params: {
  baseUrl: string;
  importApiKey: string;
  fileNames: string[];
}): Promise<
  | { ok: true; presentFileNames: string[]; missingFileNames: string[] }
  | { ok: false; message: string }
> {
  if (params.fileNames.length === 0) {
    return { ok: true, presentFileNames: [], missingFileNames: [] };
  }
  const res = await fetchJsonFromProductionViewerV1({
    baseUrl: params.baseUrl,
    path: "/api/wish-kanban-board/description-uploaded-assets-presence-check-v1",
    method: "POST",
    importApiKey: params.importApiKey,
    body: { fileNames: params.fileNames },
  });
  if (!res.ok) return { ok: false, message: res.message };
  const json = res.json;
  if (!json || typeof json !== "object" || (json as { ok?: unknown }).ok !== true) {
    return { ok: false, message: "Resposta inválida no presence-check de assets." };
  }
  const present = (json as { presentFileNames?: unknown }).presentFileNames;
  const missing = (json as { missingFileNames?: unknown }).missingFileNames;
  return {
    ok: true,
    presentFileNames: Array.isArray(present) ? present.filter((x): x is string => typeof x === "string") : [],
    missingFileNames: Array.isArray(missing) ? missing.filter((x): x is string => typeof x === "string") : [],
  };
}

function buildConfirmMessagePtBr(params: {
  boardDiff: WishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1;
  assetsToUploadCount: number;
  assetsAlreadyOnRemoteCount: number;
  missingLocalAssetCount: number;
}): string {
  const lines = [
    "Publicar o quadro atual na VPS? Isso substitui o snapshot de produção.",
    "",
    `Diff: ${params.boardDiff.summaryPtBr}`,
    `Imagens: ${params.assetsToUploadCount} para enviar, ${params.assetsAlreadyOnRemoteCount} já na VPS.`,
  ];
  if (params.missingLocalAssetCount > 0) {
    lines.push(
      `Atenção: ${params.missingLocalAssetCount} imagem(ns) referenciada(s) não estão no disco local.`,
    );
  }
  return lines.join("\n");
}

/** Prévia: diff do quadro + quantas imagens faltam na VPS. */
export async function wishPreviewPublishKanbanBoardToProductionViewerFromLocalServerV1(params: {
  board: WishKanbanBoard;
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
}): Promise<WishPublishKanbanBoardToProductionViewerPreviewResultV1> {
  const env = params.env ?? process.env;
  const cfg = readProductionEnvOrError(env);
  if (!cfg.ok) return cfg;

  const remote = await fetchRemoteBoardOrNull({
    baseUrl: cfg.baseUrl,
    importApiKey: cfg.importApiKey,
  });
  if (!remote.ok) {
    return { ok: false, code: "production_board_get_failed", message: remote.message };
  }

  const boardDiff = wishKanbanBoardDiffLocalVersusRemoteForProductionPublishPreviewV1({
    localBoard: params.board,
    remoteBoard: remote.board,
  });

  const localAssetNames = wishKanbanBoardCollectMirroredDescriptionUploadedAssetFileNamesFromBoardMarkdownV1(
    params.board,
  );
  const { assetsBase64ByFileName, missingFileNames } =
    await wishKanbanBoardCollectMirroredDescriptionUploadedAssetsBase64FromLocalDataDirectoryOnServerV1(
      params.board,
    );
  const localOnDiskNames = Object.keys(assetsBase64ByFileName);

  const presence = await checkRemoteAssetPresenceV1({
    baseUrl: cfg.baseUrl,
    importApiKey: cfg.importApiKey,
    fileNames: localOnDiskNames,
  });
  if (!presence.ok) {
    return { ok: false, code: "production_assets_presence_failed", message: presence.message };
  }

  const presentSet = new Set(presence.presentFileNames);
  const assetsToUploadCount = localOnDiskNames.filter((n) => !presentSet.has(n)).length;
  const assetsAlreadyOnRemoteCount = localOnDiskNames.filter((n) => presentSet.has(n)).length;

  return {
    ok: true,
    productionBaseUrl: cfg.baseUrl,
    boardDiff,
    localAssetCount: localAssetNames.length,
    assetsAlreadyOnRemoteCount,
    assetsToUploadCount,
    missingLocalAssetCount: missingFileNames.length,
    confirmMessagePtBr: buildConfirmMessagePtBr({
      boardDiff,
      assetsToUploadCount,
      assetsAlreadyOnRemoteCount,
      missingLocalAssetCount: missingFileNames.length,
    }),
  };
}

/**
 * Publica o quadro na VPS. Envia só imagens que ainda não existem no remoto; board completo no PUT.
 */
export async function wishPublishKanbanBoardToProductionViewerFromLocalServerV1(params: {
  board: WishKanbanBoard;
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
}): Promise<WishPublishKanbanBoardToProductionViewerResultV1> {
  const env = params.env ?? process.env;
  const cfg = readProductionEnvOrError(env);
  if (!cfg.ok) return cfg;

  const { assetsBase64ByFileName, missingFileNames } =
    await wishKanbanBoardCollectMirroredDescriptionUploadedAssetsBase64FromLocalDataDirectoryOnServerV1(
      params.board,
    );

  const localOnDiskNames = Object.keys(assetsBase64ByFileName);
  const presence = await checkRemoteAssetPresenceV1({
    baseUrl: cfg.baseUrl,
    importApiKey: cfg.importApiKey,
    fileNames: localOnDiskNames,
  });
  if (!presence.ok) {
    return { ok: false, code: "production_assets_presence_failed", message: presence.message };
  }

  const presentSet = new Set(presence.presentFileNames);
  const assetsToUpload: Record<string, string> = {};
  for (const [name, b64] of Object.entries(assetsBase64ByFileName)) {
    if (!presentSet.has(name)) assetsToUpload[name] = b64;
  }
  const assetSkippedAlreadyOnRemoteCount = localOnDiskNames.length - Object.keys(assetsToUpload).length;

  let assetWrittenCount = 0;
  let assetSkippedInvalidCount = 0;

  if (Object.keys(assetsToUpload).length > 0) {
    const assetsPut = await fetchJsonFromProductionViewerV1({
      baseUrl: cfg.baseUrl,
      path: "/api/wish-kanban-board/description-uploaded-assets-import-v1",
      method: "PUT",
      importApiKey: cfg.importApiKey,
      body: { assetsBase64ByFileName: assetsToUpload },
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
      else assetWrittenCount = Object.keys(assetsToUpload).length;
      if (typeof j.skippedCount === "number") assetSkippedInvalidCount = j.skippedCount;
    } else {
      assetWrittenCount = Object.keys(assetsToUpload).length;
    }
  }

  const boardPut = await fetchJsonFromProductionViewerV1({
    baseUrl: cfg.baseUrl,
    path: "/api/wish-kanban-board/persisted-v1",
    method: "PUT",
    importApiKey: cfg.importApiKey,
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
    assetSkippedAlreadyOnRemoteCount,
    assetSkippedInvalidCount,
    missingLocalAssetCount: missingFileNames.length,
    productionBaseUrl: cfg.baseUrl,
  };
}
