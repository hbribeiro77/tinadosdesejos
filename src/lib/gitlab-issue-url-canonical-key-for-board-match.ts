import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import { parseGitLabIssueUrl } from "@/lib/parse-gitlab-issue-url";

/**
 * Chave estável para saber se uma URL de issue do GitLab é a mesma que outra
 * (http vs https, barra final, querystring, segmentos codificados no path).
 */
export function gitlabIssueUrlCanonicalKeyForBoardMatch(raw: string): string | null {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return null;
  try {
    const p = parseGitLabIssueUrl(trimmed);
    const url = new URL(trimmed);
    return `${url.host.toLowerCase()}/${p.projectPath}/-/issues/${p.iid}`;
  } catch {
    return null;
  }
}

/** Evita duplicar card quando a mesma issue já existe em alguma coluna (usa chave canônica; fallback: string igual). */
export function gitlabIssueUrlAlreadyPresentOnWishKanbanBoard(
  board: WishKanbanBoard,
  rawIssueUrl: string,
): boolean {
  const trimmed = typeof rawIssueUrl === "string" ? rawIssueUrl.trim() : "";
  if (!trimmed) return false;

  const incoming = gitlabIssueUrlCanonicalKeyForBoardMatch(trimmed);
  if (incoming) {
    for (const card of Object.values(board.cardsById)) {
      const k = gitlabIssueUrlCanonicalKeyForBoardMatch(card.issueUrl);
      if (k === incoming) return true;
    }
    return false;
  }

  for (const card of Object.values(board.cardsById)) {
    if (card.issueUrl.trim() === trimmed) return true;
  }
  return false;
}
