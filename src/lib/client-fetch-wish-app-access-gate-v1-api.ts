export type WishAppAccessGatePostResponseV1 =
  | { ok: true }
  | { ok: false; code?: string; message: string };

export async function clientFetchWishAppAccessGateV1Post(
  secret: string,
): Promise<WishAppAccessGatePostResponseV1> {
  try {
    const response = await fetch("/api/wish-app-access-gate-v1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
      cache: "no-store",
    });
    const json = (await response.json().catch(() => null)) as WishAppAccessGatePostResponseV1 | null;
    if (!json || typeof json !== "object") {
      return { ok: false, message: `Resposta inválida (HTTP ${response.status}).` };
    }
    if (!response.ok || !("ok" in json) || json.ok !== true) {
      const message =
        "message" in json && typeof json.message === "string"
          ? json.message
          : `HTTP ${response.status}`;
      return {
        ok: false,
        code: "code" in json && typeof json.code === "string" ? json.code : undefined,
        message,
      };
    }
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Falha de rede ao validar o secret.",
    };
  }
}

export async function clientFetchWishAppAccessGateV1Delete(): Promise<{ ok: boolean; message?: string }> {
  try {
    const response = await fetch("/api/wish-app-access-gate-v1", {
      method: "DELETE",
      cache: "no-store",
    });
    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}` };
    }
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Falha de rede ao sair.",
    };
  }
}
