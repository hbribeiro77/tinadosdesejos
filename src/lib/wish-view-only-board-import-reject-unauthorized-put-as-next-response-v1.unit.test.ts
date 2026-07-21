import { describe, expect, it } from "vitest";
import { wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1 } from "@/lib/wish-view-only-board-import-reject-unauthorized-put-as-next-response-v1";
import { WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1 } from "@/lib/wish-view-only-board-import-unauthorized-code-constant-v1";

function fakeRequest(authorization?: string): Request {
  return new Request("http://localhost/api/wish-kanban-board/persisted-v1", {
    method: "PUT",
    headers: authorization ? { Authorization: authorization } : undefined,
  });
}

describe("wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1", () => {
  it("retorna null fora de view-only (mesmo sem key)", () => {
    const res = wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1(fakeRequest(), {
      WISH_VIEW_ONLY_MODE: undefined,
      WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY: "",
    });
    expect(res).toBeNull();
  });

  it("fail-closed em view-only sem key configurada", async () => {
    const res = wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1(
      fakeRequest("Bearer anything"),
      {
        WISH_VIEW_ONLY_MODE: "1",
        WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY: "",
      },
    );
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const json = (await res!.json()) as { code: string };
    expect(json.code).toBe(WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1);
  });

  it("rejeita Bearer errado e aceita Bearer correto", async () => {
    const env = {
      WISH_VIEW_ONLY_MODE: "1",
      WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY: "correct-key",
    };
    const bad = wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1(
      fakeRequest("Bearer wrong-key"),
      env,
    );
    expect(bad).not.toBeNull();
    expect(bad!.status).toBe(403);

    const good = wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1(
      fakeRequest("Bearer correct-key"),
      env,
    );
    expect(good).toBeNull();
  });
});
