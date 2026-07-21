import type { WishAppRuntimeFlagsV1GetResponseDto } from "@/lib/wish-app-runtime-flags-v1-api-response-dto-types";

export async function clientFetchWishAppRuntimeFlagsV1Get(): Promise<WishAppRuntimeFlagsV1GetResponseDto> {
  try {
    const response = await fetch("/api/wish-app-runtime-flags-v1", { cache: "no-store" });
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
        message: `Resposta inválida ao ler flags da Tina (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      const message =
        "message" in jsonBody && typeof (jsonBody as { message?: unknown }).message === "string"
          ? String((jsonBody as { message: string }).message)
          : `HTTP ${response.status}`;
      return { ok: false, message };
    }

    return jsonBody as WishAppRuntimeFlagsV1GetResponseDto;
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Falha de rede ao ler flags da Tina.",
    };
  }
}
