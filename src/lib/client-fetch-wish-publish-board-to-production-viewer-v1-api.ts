export type WishPublishBoardToProductionViewerV1ClientResponse =
  | {
      ok: true;
      assetWrittenCount: number;
      assetSkippedAlreadyOnRemoteCount?: number;
      assetSkippedInvalidCount?: number;
      missingLocalAssetCount: number;
      productionBaseUrl: string;
    }
  | { ok: false; code?: string; message: string };

export type WishPublishBoardToProductionViewerPreviewV1ClientResponse =
  | {
      ok: true;
      productionBaseUrl: string;
      confirmMessagePtBr: string;
      assetsToUploadCount: number;
      assetsAlreadyOnRemoteCount: number;
      missingLocalAssetCount: number;
      boardDiff: {
        summaryPtBr: string;
        cardsAdded: number;
        cardsRemoved: number;
        cardsChanged: number;
        remoteBoardMissing: boolean;
      };
    }
  | { ok: false; code?: string; message: string };

async function postPublishApi(
  body: Record<string, unknown>,
): Promise<WishPublishBoardToProductionViewerV1ClientResponse | WishPublishBoardToProductionViewerPreviewV1ClientResponse> {
  try {
    const response = await fetch("/api/wish-publish-board-to-production-viewer-v1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await response.json().catch(() => null)) as
      | WishPublishBoardToProductionViewerV1ClientResponse
      | WishPublishBoardToProductionViewerPreviewV1ClientResponse
      | null;
    if (!json || typeof json !== "object") {
      return { ok: false, message: `Resposta inválida (HTTP ${response.status}).` };
    }
    if (!response.ok || !("ok" in json) || json.ok !== true) {
      return {
        ok: false,
        code: "code" in json && typeof json.code === "string" ? json.code : undefined,
        message:
          "message" in json && typeof json.message === "string"
            ? json.message
            : `HTTP ${response.status}`,
      };
    }
    return json;
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Falha de rede ao publicar na VPS.",
    };
  }
}

export async function clientFetchWishPublishBoardToProductionViewerPreviewV1Post(params?: {
  board?: unknown;
}): Promise<WishPublishBoardToProductionViewerPreviewV1ClientResponse> {
  return (await postPublishApi({
    preview: true,
    ...(params?.board ? { board: params.board } : {}),
  })) as WishPublishBoardToProductionViewerPreviewV1ClientResponse;
}

export async function clientFetchWishPublishBoardToProductionViewerV1Post(params?: {
  board?: unknown;
}): Promise<WishPublishBoardToProductionViewerV1ClientResponse> {
  return (await postPublishApi({
    ...(params?.board ? { board: params.board } : {}),
  })) as WishPublishBoardToProductionViewerV1ClientResponse;
}
