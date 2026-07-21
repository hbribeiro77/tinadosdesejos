export type WishKanbanBoardDescriptionUploadedAssetsImportV1ResponseDto =
  | { ok: true; writtenCount: number; skippedCount: number }
  | { ok: false; code?: string; message: string };

export async function clientFetchWishKanbanBoardDescriptionUploadedAssetsImportV1Put(
  assetsBase64ByFileName: Record<string, string>,
  options?: { importApiKey?: string },
): Promise<WishKanbanBoardDescriptionUploadedAssetsImportV1ResponseDto> {
  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    const importApiKey = options?.importApiKey?.trim();
    if (importApiKey) {
      headers.Authorization = `Bearer ${importApiKey}`;
    }

    const response = await fetch("/api/wish-kanban-board/description-uploaded-assets-import-v1", {
      method: "PUT",
      headers,
      body: JSON.stringify({ assetsBase64ByFileName }),
    });

    const text = await response.text();
    let jsonBody: unknown = null;
    if (text.trim()) {
      try {
        jsonBody = JSON.parse(text) as unknown;
      } catch {
        jsonBody = null;
      }
    }

    if (!jsonBody || typeof jsonBody !== "object") {
      return {
        ok: false,
        message: `Resposta inválida ao importar imagens (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      const message =
        "message" in jsonBody && typeof (jsonBody as { message?: unknown }).message === "string"
          ? String((jsonBody as { message: string }).message)
          : `HTTP ${response.status}`;
      const code =
        "code" in jsonBody && typeof (jsonBody as { code?: unknown }).code === "string"
          ? String((jsonBody as { code: string }).code)
          : "http_error";
      return { ok: false, code, message };
    }

    return jsonBody as WishKanbanBoardDescriptionUploadedAssetsImportV1ResponseDto;
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Falha de rede ao importar imagens.",
    };
  }
}
