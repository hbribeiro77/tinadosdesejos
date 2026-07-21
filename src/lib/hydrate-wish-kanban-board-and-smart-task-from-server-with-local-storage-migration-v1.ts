import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";
import {
  clearWishKanbanBoardFromLocalStorageAfterSqliteMigrationV1,
  createEmptyWishKanbanBoard,
  readWishKanbanBoardFromLocalStorage,
} from "@/lib/wish-board-localstorage-serialization";
import { clientFetchWishKanbanBoardPersistedV1Get, clientFetchWishKanbanBoardPersistedV1Put } from "@/lib/client-fetch-wish-kanban-board-persisted-v1-api";
import {
  clientFetchWishSmartTaskImportedTasksPersistedV1Get,
  clientFetchWishSmartTaskImportedTasksPersistedV1Put,
} from "@/lib/client-fetch-wish-smart-task-imported-tasks-persisted-v1-api";
import {
  clearWishSmartTaskImportedTasksFromLocalStorageAfterSqliteMigrationV1,
  readWishSmartTaskImportedTasksFromLocalStorage,
} from "@/lib/wish-smart-task-imported-tasks-local-storage-serialization";

export type HydrateWishKanbanBoardAndSmartTaskFromServerResultV1 = {
  board: WishKanbanBoard;
  boardSource: "server" | "local_storage_migrated" | "empty";
  smartTaskTasks: SmartTaskNormalizedTask[];
  smartTaskSource: "server" | "local_storage_migrated" | "empty";
  errors: string[];
};

/**
 * Hidrata quadro e tarefas SmartTask do SQLite (via API).
 * Se o servidor estiver vazio, tenta migrar uma vez do `localStorage` legado.
 */
export async function hydrateWishKanbanBoardAndSmartTaskFromServerWithLocalStorageMigrationV1(): Promise<HydrateWishKanbanBoardAndSmartTaskFromServerResultV1> {
  const errors: string[] = [];

  let board: WishKanbanBoard = createEmptyWishKanbanBoard();
  let boardSource: HydrateWishKanbanBoardAndSmartTaskFromServerResultV1["boardSource"] = "empty";

  const boardGet = await clientFetchWishKanbanBoardPersistedV1Get();
  if (!boardGet.ok) {
    errors.push(boardGet.message);
  } else if (boardGet.found) {
    board = boardGet.board;
    boardSource = "server";
  } else {
    const localBoard = readWishKanbanBoardFromLocalStorage();
    if (localBoard) {
      const put = await clientFetchWishKanbanBoardPersistedV1Put(localBoard);
      if (put.ok) {
        board = localBoard;
        boardSource = "local_storage_migrated";
        clearWishKanbanBoardFromLocalStorageAfterSqliteMigrationV1();
      } else {
        errors.push(put.message);
        board = localBoard;
        boardSource = "local_storage_migrated";
      }
    }
  }

  let smartTaskTasks: SmartTaskNormalizedTask[] = [];
  let smartTaskSource: HydrateWishKanbanBoardAndSmartTaskFromServerResultV1["smartTaskSource"] = "empty";

  const tasksGet = await clientFetchWishSmartTaskImportedTasksPersistedV1Get();
  if (!tasksGet.ok) {
    errors.push(tasksGet.message);
  } else if (tasksGet.found) {
    smartTaskTasks = tasksGet.tasks;
    smartTaskSource = "server";
  } else {
    const localTasks = readWishSmartTaskImportedTasksFromLocalStorage();
    if (localTasks && localTasks.length > 0) {
      const put = await clientFetchWishSmartTaskImportedTasksPersistedV1Put(localTasks);
      if (put.ok) {
        smartTaskTasks = localTasks;
        smartTaskSource = "local_storage_migrated";
        clearWishSmartTaskImportedTasksFromLocalStorageAfterSqliteMigrationV1();
      } else {
        errors.push(put.message);
        smartTaskTasks = localTasks;
        smartTaskSource = "local_storage_migrated";
      }
    }
  }

  const uniqueErrors = [...new Set(errors)];

  return { board, boardSource, smartTaskTasks, smartTaskSource, errors: uniqueErrors };
}
