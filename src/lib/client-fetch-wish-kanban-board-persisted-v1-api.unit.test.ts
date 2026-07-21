import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientFetchWishKanbanBoardPersistedV1Get } from "@/lib/client-fetch-wish-kanban-board-persisted-v1-api";

describe("clientFetchWishKanbanBoardPersistedV1Get", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("não lança exceção quando o servidor retorna 404 HTML (rota ausente / servidor antigo)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("<!DOCTYPE html><html><body>Not Found</body></html>", {
        status: 404,
        headers: { "content-type": "text/html" },
      }),
    );

    const result = await clientFetchWishKanbanBoardPersistedV1Get();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("404");
    }
  });

  it("interpreta JSON válido com found:false", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true, found: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await clientFetchWishKanbanBoardPersistedV1Get();

    expect(result).toEqual({ ok: true, found: false });
  });
});
