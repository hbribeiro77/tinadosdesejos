import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";
import type {
  WishSmartTaskImportedTasksPersistedV1GetResponseDto,
  WishSmartTaskImportedTasksPersistedV1PutResponseDto,
} from "@/lib/wish-smart-task-imported-tasks-persisted-v1-api-response-dto-types";

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

export async function clientFetchWishSmartTaskImportedTasksPersistedV1Get(): Promise<WishSmartTaskImportedTasksPersistedV1GetResponseDto> {
  try {
    const response = await fetch("/api/wish-smart-task/imported-tasks-persisted-v1", { cache: "no-store" });
    const jsonBody = await parseJsonResponseBodySafely(response);

    if (!jsonBody || typeof jsonBody !== "object") {
      return {
        ok: false,
        message: `Resposta inválida ao carregar SmartTask (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      return { ok: false, message: readErrorMessageFromJsonBody(jsonBody, response.status) };
    }

    return jsonBody as WishSmartTaskImportedTasksPersistedV1GetResponseDto;
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Falha de rede ao carregar SmartTask.",
    };
  }
}

export async function clientFetchWishSmartTaskImportedTasksPersistedV1Put(
  tasks: SmartTaskNormalizedTask[],
): Promise<WishSmartTaskImportedTasksPersistedV1PutResponseDto> {
  try {
    const response = await fetch("/api/wish-smart-task/imported-tasks-persisted-v1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tasks }),
    });
    const jsonBody = await parseJsonResponseBodySafely(response);

    if (!jsonBody || typeof jsonBody !== "object") {
      return {
        ok: false,
        message: `Resposta inválida ao salvar SmartTask (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: "http_error",
        message: readErrorMessageFromJsonBody(jsonBody, response.status),
      };
    }

    return jsonBody as WishSmartTaskImportedTasksPersistedV1PutResponseDto;
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Falha de rede ao salvar SmartTask.",
    };
  }
}
