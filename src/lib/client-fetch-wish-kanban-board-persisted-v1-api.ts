import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import type {
  WishKanbanBoardPersistedV1GetResponseDto,
  WishKanbanBoardPersistedV1PutResponseDto,
} from "@/lib/wish-kanban-board-persisted-v1-api-response-dto-types";

function readErrorMessageFromJsonBody(jsonBody: unknown, httpStatus: number): string {
  if (jsonBody && typeof jsonBody === "object" && "message" in jsonBody) {
    const message = (jsonBody as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return `HTTP ${httpStatus}`;
}

async function parseJsonResponseBodySafely(response: Response): Promise<unknown | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function clientFetchWishKanbanBoardPersistedV1Get(): Promise<WishKanbanBoardPersistedV1GetResponseDto> {
  try {
    const response = await fetch("/api/wish-kanban-board/persisted-v1", { cache: "no-store" });
    const jsonBody = await parseJsonResponseBodySafely(response);

    if (!jsonBody || typeof jsonBody !== "object") {
      return {
        ok: false,
        message: `Resposta inválida ao carregar o quadro (HTTP ${response.status}). A rota /api/wish-kanban-board/persisted-v1 existe? Reinicie o servidor de desenvolvimento.`,
      };
    }

    if (!response.ok) {
      return { ok: false, message: readErrorMessageFromJsonBody(jsonBody, response.status) };
    }

    return jsonBody as WishKanbanBoardPersistedV1GetResponseDto;
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Falha de rede ao carregar o quadro.",
    };
  }
}

export async function clientFetchWishKanbanBoardPersistedV1Put(
  board: WishKanbanBoard,
  options?: { importApiKey?: string },
): Promise<WishKanbanBoardPersistedV1PutResponseDto> {
  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    const importApiKey = options?.importApiKey?.trim();
    if (importApiKey) {
      headers.Authorization = `Bearer ${importApiKey}`;
    }

    const response = await fetch("/api/wish-kanban-board/persisted-v1", {
      method: "PUT",
      headers,
      body: JSON.stringify({ board }),
    });
    const jsonBody = await parseJsonResponseBodySafely(response);

    if (!jsonBody || typeof jsonBody !== "object") {
      return {
        ok: false,
        message: `Resposta inválida ao salvar o quadro (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      const codeFromBody =
        "code" in jsonBody && typeof (jsonBody as { code?: unknown }).code === "string"
          ? String((jsonBody as { code: string }).code)
          : "http_error";
      return {
        ok: false,
        code: codeFromBody,
        message: readErrorMessageFromJsonBody(jsonBody, response.status),
      };
    }

    return jsonBody as WishKanbanBoardPersistedV1PutResponseDto;
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Falha de rede ao salvar o quadro.",
    };
  }
}
