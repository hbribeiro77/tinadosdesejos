import { describe, expect, it } from "vitest";
import { wishAppAccessGatePathAllowsBoardImportPutWithBearerWithoutSessionCookieV1 } from "@/lib/wish-app-access-gate-path-allows-board-import-put-with-bearer-without-session-cookie-v1";

describe("wishAppAccessGatePathAllowsBoardImportPutWithBearerWithoutSessionCookieV1", () => {
  it("libera só PUT das rotas de import do quadro/assets com Authorization Bearer", () => {
    expect(
      wishAppAccessGatePathAllowsBoardImportPutWithBearerWithoutSessionCookieV1({
        pathname: "/api/wish-kanban-board/persisted-v1",
        method: "PUT",
        authorizationHeader: "Bearer abc",
      }),
    ).toBe(true);
    expect(
      wishAppAccessGatePathAllowsBoardImportPutWithBearerWithoutSessionCookieV1({
        pathname: "/api/wish-kanban-board/description-uploaded-assets-import-v1",
        method: "PUT",
        authorizationHeader: "Bearer abc",
      }),
    ).toBe(true);
    expect(
      wishAppAccessGatePathAllowsBoardImportPutWithBearerWithoutSessionCookieV1({
        pathname: "/api/wish-kanban-board/persisted-v1",
        method: "GET",
        authorizationHeader: "Bearer abc",
      }),
    ).toBe(false);
    expect(
      wishAppAccessGatePathAllowsBoardImportPutWithBearerWithoutSessionCookieV1({
        pathname: "/api/wish-kanban-board/persisted-v1",
        method: "PUT",
        authorizationHeader: null,
      }),
    ).toBe(false);
  });
});
