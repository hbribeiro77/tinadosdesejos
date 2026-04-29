import type { GitLabIssueResolveResponse } from "@/lib/gitlab-issue-summary-dto-types";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import {
  wishKanbanBoardSetCardError,
  wishKanbanBoardUpsertCardSnapshot,
} from "@/lib/wish-kanban-board-immutable-update-helpers";

export function wishKanbanBoardApplyBulkGitlabIssueResolveResponseBatchToBoard(
  board: WishKanbanBoard,
  batch: Array<{ cardIds: string[]; res: GitLabIssueResolveResponse }>,
): WishKanbanBoard {
  let next = board;
  for (const { cardIds, res } of batch) {
    for (const cardId of cardIds) {
      if (!res.ok) next = wishKanbanBoardSetCardError(next, cardId, res.message);
      else next = wishKanbanBoardUpsertCardSnapshot(next, cardId, res.data);
    }
  }
  return next;
}
