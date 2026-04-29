import { describe, expect, it } from "vitest";
import {
  gitlabIssueUrlAlreadyPresentOnWishKanbanBoard,
  gitlabIssueUrlCanonicalKeyForBoardMatch,
} from "@/lib/gitlab-issue-url-canonical-key-for-board-match";

describe("gitlabIssueUrlCanonicalKeyForBoardMatch", () => {
  it("retorna a mesma chave para http e https no mesmo host/path/iid", () => {
    const a = gitlabIssueUrlCanonicalKeyForBoardMatch(
      "http://gitlab.intra/defensoria/app/-/issues/42",
    );
    const b = gitlabIssueUrlCanonicalKeyForBoardMatch(
      "https://gitlab.intra/defensoria/app/-/issues/42",
    );
    expect(a).toBe(b);
    expect(a).toBe("gitlab.intra/defensoria/app/-/issues/42");
  });

  it("ignora barra final, query e fragmento", () => {
    const a = gitlabIssueUrlCanonicalKeyForBoardMatch("https://x/a/b/-/issues/7");
    const b = gitlabIssueUrlCanonicalKeyForBoardMatch("https://x/a/b/-/issues/7/?x=1#c");
    expect(a).toBe(b);
  });

  it("inclui porta no host quando não é default", () => {
    const k = gitlabIssueUrlCanonicalKeyForBoardMatch("http://localhost:8080/g/p/-/issues/1");
    expect(k).toBe("localhost:8080/g/p/-/issues/1");
  });

  it("retorna null para string vazia ou URL inválida", () => {
    expect(gitlabIssueUrlCanonicalKeyForBoardMatch("")).toBeNull();
    expect(gitlabIssueUrlCanonicalKeyForBoardMatch("   ")).toBeNull();
    expect(gitlabIssueUrlCanonicalKeyForBoardMatch("not-a-url")).toBeNull();
  });
});

describe("gitlabIssueUrlAlreadyPresentOnWishKanbanBoard", () => {
  const board = {
    id: "b",
    title: "t",
    columnOrder: ["c1"],
    columnsById: { c1: { id: "c1", title: "A", cardIds: ["card1"] } },
    cardsById: {
      card1: {
        id: "card1",
        columnId: "c1",
        issueUrl: "https://gitlab.intra/defensoria/app/-/issues/42",
        lastError: null,
      },
    },
  };

  it("detecta mesma issue por URL equivalente (https vs http)", () => {
    expect(
      gitlabIssueUrlAlreadyPresentOnWishKanbanBoard(
        board,
        "http://gitlab.intra/defensoria/app/-/issues/42",
      ),
    ).toBe(true);
  });

  it("retorna false quando a issue não está no board", () => {
    expect(
      gitlabIssueUrlAlreadyPresentOnWishKanbanBoard(
        board,
        "https://gitlab.intra/defensoria/app/-/issues/99",
      ),
    ).toBe(false);
  });
});
