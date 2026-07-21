import { describe, expect, it } from "vitest";
import {
  createEmptyWishKanbanBoard,
  parseWishKanbanPersistedPayloadV1,
  stringifyWishKanbanBoard,
} from "@/lib/wish-board-localstorage-serialization";

describe("wish board persisted payload v1", () => {
  it("round-trip do quadro para JSON persistido", () => {
    const board = createEmptyWishKanbanBoard();
    board.title = "Tina de testes";

    const json = stringifyWishKanbanBoard(board);
    expect(parseWishKanbanPersistedPayloadV1(json)?.board.title).toBe("Tina de testes");
  });
});
