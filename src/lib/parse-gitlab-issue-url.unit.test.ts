import { describe, expect, it } from "vitest";
import { GitLabIssueUrlParseError, parseGitLabIssueUrl } from "@/lib/parse-gitlab-issue-url";

describe("parseGitLabIssueUrl", () => {
  it("parseia URL padrão com subgroup e IID", () => {
    const parsed = parseGitLabIssueUrl(
      "https://gitlab.intra/defensoria/app/-/issues/42",
    );
    expect(parsed).toEqual({
      origin: "https://gitlab.intra",
      hostname: "gitlab.intra",
      projectPath: "defensoria/app",
      iid: 42,
    });
  });

  it("aceita barra final e querystring", () => {
    const parsed = parseGitLabIssueUrl(
      "https://gitlab.intra/a/b/-/issues/7/?sort=created_date&state=opened",
    );
    expect(parsed.projectPath).toBe("a/b");
    expect(parsed.iid).toBe(7);
  });

  it("aceita porta explícita", () => {
    const parsed = parseGitLabIssueUrl("http://localhost:8080/g/p/-/issues/1");
    expect(parsed.origin).toBe("http://localhost:8080");
    expect(parsed.hostname).toBe("localhost");
    expect(parsed.projectPath).toBe("g/p");
    expect(parsed.iid).toBe(1);
  });

  it("falha para URL sem padrão de issue", () => {
    expect(() => parseGitLabIssueUrl("https://gitlab.intra/a/b/-/merge_requests/1")).toThrow(
      GitLabIssueUrlParseError,
    );
  });

  it("falha para string inválida", () => {
    expect(() => parseGitLabIssueUrl("não-é-url")).toThrow(GitLabIssueUrlParseError);
  });
});
