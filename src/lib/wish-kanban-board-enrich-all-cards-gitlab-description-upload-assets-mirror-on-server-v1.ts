import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import { enrichGitLabIssueSummaryDtoWithMirroredDescriptionUploadAssetsOnServerV1 } from "@/lib/mirror-gitlab-issue-description-upload-assets-to-local-data-directory-and-rewrite-markdown-on-server-v1";

/** Markdown ainda aponta para uploads do GitLab (relativo ou absoluto) — candidato a espelhar. */
export function wishKanbanBoardCardGitlabDescriptionMarkdownNeedsUploadAssetMirrorV1(
  markdown: string | null | undefined,
): boolean {
  if (typeof markdown !== "string" || !markdown.trim()) return false;
  return /\/uploads\//i.test(markdown);
}

/**
 * Espelha imagens `/uploads/` de todos os cards que ainda referenciam o GitLab.
 * Idempotente após o primeiro espelho (markdown passa a usar URLs locais).
 */
export async function wishKanbanBoardEnrichAllCardsGitlabDescriptionUploadAssetsMirrorOnServerV1(
  board: WishKanbanBoard,
): Promise<WishKanbanBoard> {
  if (process.env.GITLAB_MOCK === "1") return board;

  const gitlabBaseUrl = process.env.GITLAB_BASE_URL;
  const gitlabToken = process.env.GITLAB_TOKEN;
  if (!gitlabBaseUrl || !gitlabToken) return board;

  const tlsInsecureDev = process.env.GITLAB_TLS_INSECURE_DEV === "1";
  let changed = false;
  const cardsById = { ...board.cardsById };

  for (const [cardId, card] of Object.entries(cardsById)) {
    const snapshot = card.snapshot?.data;
    const markdown = snapshot?.gitlabDescriptionMarkdown;
    if (!snapshot?.webUrl?.trim() || !wishKanbanBoardCardGitlabDescriptionMarkdownNeedsUploadAssetMirrorV1(markdown)) {
      continue;
    }

    const enriched = await enrichGitLabIssueSummaryDtoWithMirroredDescriptionUploadAssetsOnServerV1(snapshot, {
      gitlabBaseUrl,
      token: gitlabToken,
      tlsInsecureDev,
    });

    if (enriched.gitlabDescriptionMarkdown === markdown && enriched === snapshot) {
      continue;
    }

    cardsById[cardId] = {
      ...card,
      snapshot: {
        ...card.snapshot!,
        data: enriched,
      },
    };
    changed = true;
  }

  return changed ? { ...board, cardsById } : board;
}
