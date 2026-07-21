import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";

/** Bundle de export/import: quadro + binários espelhados (base64) para o viewer sem GitLab. */
export type WishKanbanBoardExportBundleWithDescriptionUploadedAssetsV1 = {
  version: 2;
  board: WishKanbanBoard;
  /** fileName → base64 (sem data-URL prefix) */
  descriptionUploadedAssetsBase64ByFileNameV1: Record<string, string>;
};

export type WishKanbanBoardExportBundleParsedV1 = {
  board: WishKanbanBoard;
  descriptionUploadedAssetsBase64ByFileNameV1: Record<string, string>;
};
