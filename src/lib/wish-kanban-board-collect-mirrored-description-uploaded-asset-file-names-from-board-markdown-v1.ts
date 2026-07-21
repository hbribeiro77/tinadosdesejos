import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import { WISH_GITLAB_DESCRIPTION_UPLOADED_ASSET_SERVE_API_PREFIX_V1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-is-valid-for-serve-v1";
import { wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-is-valid-for-serve-v1";

const LOCAL_SERVE_URL_RE = new RegExp(
  `${WISH_GITLAB_DESCRIPTION_UPLOADED_ASSET_SERVE_API_PREFIX_V1.replace(/\//g, "\\/")}\\/([a-f0-9]{64}\\.(?:png|jpe?g|gif|webp|svg))`,
  "gi",
);

/** Extrai nomes de arquivos espelhados referenciados no markdown dos snapshots do quadro. */
export function wishKanbanBoardCollectMirroredDescriptionUploadedAssetFileNamesFromBoardMarkdownV1(
  board: WishKanbanBoard,
): string[] {
  const found = new Set<string>();

  for (const card of Object.values(board.cardsById)) {
    const md = card?.snapshot?.data?.gitlabDescriptionMarkdown;
    if (typeof md !== "string" || !md.trim()) continue;

    LOCAL_SERVE_URL_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = LOCAL_SERVE_URL_RE.exec(md)) !== null) {
      const fileName = match[1]!;
      if (wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1(fileName)) {
        found.add(fileName);
      }
    }
  }

  return [...found].sort();
}
