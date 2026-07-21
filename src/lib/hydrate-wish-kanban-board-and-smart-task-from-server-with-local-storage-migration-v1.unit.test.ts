import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hydrateWishKanbanBoardAndSmartTaskFromServerWithLocalStorageMigrationV1 } from "@/lib/hydrate-wish-kanban-board-and-smart-task-from-server-with-local-storage-migration-v1";

vi.mock("@/lib/client-fetch-wish-kanban-board-persisted-v1-api", () => ({
  clientFetchWishKanbanBoardPersistedV1Get: vi.fn(),
  clientFetchWishKanbanBoardPersistedV1Put: vi.fn(),
}));

vi.mock("@/lib/client-fetch-wish-smart-task-imported-tasks-persisted-v1-api", () => ({
  clientFetchWishSmartTaskImportedTasksPersistedV1Get: vi.fn(),
  clientFetchWishSmartTaskImportedTasksPersistedV1Put: vi.fn(),
}));

import {
  clientFetchWishKanbanBoardPersistedV1Get,
  clientFetchWishKanbanBoardPersistedV1Put,
} from "@/lib/client-fetch-wish-kanban-board-persisted-v1-api";
import {
  clientFetchWishSmartTaskImportedTasksPersistedV1Get,
  clientFetchWishSmartTaskImportedTasksPersistedV1Put,
} from "@/lib/client-fetch-wish-smart-task-imported-tasks-persisted-v1-api";

describe("hydrateWishKanbanBoardAndSmartTaskFromServerWithLocalStorageMigrationV1", () => {
  beforeEach(() => {
    vi.mocked(clientFetchWishKanbanBoardPersistedV1Get).mockReset();
    vi.mocked(clientFetchWishKanbanBoardPersistedV1Put).mockReset();
    vi.mocked(clientFetchWishSmartTaskImportedTasksPersistedV1Get).mockReset();
    vi.mocked(clientFetchWishSmartTaskImportedTasksPersistedV1Put).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("retorna quadro vazio quando API falha (sem lançar)", async () => {
    vi.mocked(clientFetchWishKanbanBoardPersistedV1Get).mockResolvedValue({
      ok: false,
      message: "HTTP 404",
    });
    vi.mocked(clientFetchWishSmartTaskImportedTasksPersistedV1Get).mockResolvedValue({
      ok: true,
      found: false,
    });

    const result = await hydrateWishKanbanBoardAndSmartTaskFromServerWithLocalStorageMigrationV1();

    expect(result.board.title).toBe("Tina dos desejos");
    expect(result.boardSource).toBe("empty");
    expect(result.errors).toContain("HTTP 404");
    expect(clientFetchWishKanbanBoardPersistedV1Put).not.toHaveBeenCalled();
  });
});
