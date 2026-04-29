import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";

export type WishKanbanCardSnapshot = {
  data: GitLabIssueSummaryDto;
  fetchedAt: string;
};

export type WishKanbanCard = {
  id: string;
  columnId: string;
  issueUrl: string;
  snapshot?: WishKanbanCardSnapshot;
  lastError?: string | null;
};

export type WishKanbanColumn = {
  id: string;
  title: string;
  cardIds: string[];
  /** Coluna estreita (só título/cota); cards ficam ocultos até expandir. */
  collapsed?: boolean;
};

export type WishKanbanBoard = {
  id: string;
  title: string;
  columnOrder: string[];
  columnsById: Record<string, WishKanbanColumn>;
  cardsById: Record<string, WishKanbanCard>;
};

export type WishKanbanPersistedPayloadV1 = {
  version: 1;
  board: WishKanbanBoard;
};
