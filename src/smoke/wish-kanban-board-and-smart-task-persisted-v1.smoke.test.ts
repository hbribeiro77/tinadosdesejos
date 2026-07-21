import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createEmptyWishKanbanBoard } from "@/lib/wish-board-localstorage-serialization";
import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";

const smokeDbPath = path.join(process.cwd(), "data", "smoke-triage.db");
process.env.WISH_SQLITE_DATABASE_PATH = smokeDbPath;

const smokeBaseUrl = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const smokeRequireHttp = process.env.SMOKE_REQUIRE_HTTP === "1";
/** PUT no quadro real só com opt-in explícito (`smoke:full` usa SQLite isolado). */
const smokeAllowDestructiveHttpPut = process.env.SMOKE_ALLOW_DESTRUCTIVE_HTTP_PUT === "1";
const smokeSkipSqlite = process.env.SMOKE_SKIP_SQLITE === "1";

function removeSmokeDbFileIfExists() {
  if (!fs.existsSync(smokeDbPath)) return;
  try {
    fs.unlinkSync(smokeDbPath);
  } catch {
    /* arquivo pode estar em uso; smoke HTTP ainda valida a API real */
  }
}

async function waitForHttpServerReady(baseUrl: string, maxMs = 90_000): Promise<void> {
  const started = Date.now();
  let lastError: unknown;
  while (Date.now() - started < maxMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
      if (res.ok) return;
      lastError = new Error(`health HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(
    `Servidor não respondeu em ${baseUrl}/api/health após ${maxMs}ms: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

const sampleSmartTask: SmartTaskNormalizedTask = {
  id: "smoke-task-1",
  title: "Smoke SmartTask",
  description: "",
  dueDate: null,
  priority: 2,
  tags: [],
  subtasks: [],
  status: "active",
  focusOfDay: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archivedAt: null,
};

describe.skipIf(smokeSkipSqlite)("smoke SQLite — wish persisted v1", () => {
  beforeAll(() => {
    const dir = path.dirname(smokeDbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    removeSmokeDbFileIfExists();
  });

  afterAll(() => {
    removeSmokeDbFileIfExists();
  });

  it("grava e lê o quadro Kanban no SQLite isolado", async () => {
    const { writeWishKanbanBoardPersistedV1ToSqliteForServer, readWishKanbanBoardPersistedV1FromSqliteForServer } =
      await import("@/lib/wish-kanban-board-persisted-v1-sqlite-read-write-for-server");

    const board = createEmptyWishKanbanBoard();
    board.title = "Smoke SQLite board";

    writeWishKanbanBoardPersistedV1ToSqliteForServer(board);
    const row = readWishKanbanBoardPersistedV1FromSqliteForServer();

    expect(row.found).toBe(true);
    if (row.found) {
      expect(row.board.title).toBe("Smoke SQLite board");
    }
  });

  it("grava e lê tarefas SmartTask importadas no SQLite isolado", async () => {
    const {
      writeWishSmartTaskImportedTasksPersistedV1ToSqliteForServer,
      readWishSmartTaskImportedTasksPersistedV1FromSqliteForServer,
    } = await import("@/lib/wish-smart-task-imported-tasks-persisted-v1-sqlite-read-write-for-server");

    writeWishSmartTaskImportedTasksPersistedV1ToSqliteForServer([sampleSmartTask]);
    const row = readWishSmartTaskImportedTasksPersistedV1FromSqliteForServer();

    expect(row.found).toBe(true);
    if (row.found) {
      expect(row.tasks).toHaveLength(1);
      expect(row.tasks[0]?.id).toBe("smoke-task-1");
    }
  });
});

describe("smoke HTTP — wish persisted v1 API", () => {
  it("health, quadro PUT/GET e SmartTask PUT/GET", async () => {
    if (!smokeRequireHttp) {
      try {
        await waitForHttpServerReady(smokeBaseUrl, 3_000);
      } catch {
        console.warn(
          `[smoke] Servidor em ${smokeBaseUrl} indisponível — pulando HTTP. Rode: npm run smoke:full`,
        );
        return;
      }
    } else {
      await waitForHttpServerReady(smokeBaseUrl, 120_000);
    }

    const health = await fetch(`${smokeBaseUrl}/api/health`, { cache: "no-store" });
    expect(health.ok).toBe(true);

    const routeProbe = await fetch(`${smokeBaseUrl}/api/wish-kanban-board/persisted-v1`, {
      cache: "no-store",
    });
    const routeProbeText = await routeProbe.text();
    expect(routeProbe.status, `GET persisted-v1: ${routeProbeText.slice(0, 300)}`).toBe(200);
    const routeProbeJson = JSON.parse(routeProbeText) as { ok?: boolean };
    expect(routeProbeJson.ok).toBe(true);

    if (!smokeAllowDestructiveHttpPut) {
      console.warn(
        `[smoke] GET persisted OK em ${smokeBaseUrl}; PUT omitido (protege data/triage.db). Use npm run smoke:full para teste de escrita.`,
      );
      return;
    }

    const board = createEmptyWishKanbanBoard();
    board.title = "Smoke HTTP board (teste automatizado)";

    const putBoard = await fetch(`${smokeBaseUrl}/api/wish-kanban-board/persisted-v1`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ board }),
    });
    const putBoardText = await putBoard.text();
    expect(putBoard.status, `PUT board: ${putBoardText.slice(0, 300)}`).toBe(200);
    const putBoardJson = JSON.parse(putBoardText) as { ok: boolean };
    expect(putBoardJson.ok).toBe(true);

    const getBoard = await fetch(`${smokeBaseUrl}/api/wish-kanban-board/persisted-v1`, { cache: "no-store" });
    const getBoardText = await getBoard.text();
    expect(getBoard.status, `GET board: ${getBoardText.slice(0, 300)}`).toBe(200);
    const getBoardJson = JSON.parse(getBoardText) as { ok: boolean; found?: boolean; board?: { title?: string } };
    expect(getBoardJson.ok).toBe(true);
    expect(getBoardJson.found).toBe(true);
    expect(getBoardJson.board?.title).toBe("Smoke HTTP board (teste automatizado)");

    const putTasks = await fetch(`${smokeBaseUrl}/api/wish-smart-task/imported-tasks-persisted-v1`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tasks: [sampleSmartTask] }),
    });
    const putTasksText = await putTasks.text();
    expect(putTasks.status, `PUT tasks: ${putTasksText.slice(0, 300)}`).toBe(200);

    const getTasks = await fetch(`${smokeBaseUrl}/api/wish-smart-task/imported-tasks-persisted-v1`, {
      cache: "no-store",
    });
    const getTasksText = await getTasks.text();
    expect(getTasks.status, `GET tasks: ${getTasksText.slice(0, 300)}`).toBe(200);
    const getTasksJson = JSON.parse(getTasksText) as {
      ok: boolean;
      found?: boolean;
      tasks?: { id: string }[];
    };
    expect(getTasksJson.ok).toBe(true);
    expect(getTasksJson.found).toBe(true);
    expect(getTasksJson.tasks?.[0]?.id).toBe("smoke-task-1");
  });
});
