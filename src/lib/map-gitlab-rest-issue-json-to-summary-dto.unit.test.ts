import { describe, expect, it } from "vitest";
import { mapGitLabRestIssueJsonToSummaryDto } from "@/lib/map-gitlab-rest-issue-json-to-summary-dto";

describe("mapGitLabRestIssueJsonToSummaryDto labels", () => {
  const baseIssue = () =>
    ({
      id: 99,
      iid: 7,
      title: "Issue teste",
      state: "opened",
      web_url: "https://gitlab.example.com/a/b/-/issues/7",
      assignees: [],
      created_at: "2025-06-15T08:30:00Z",
      updated_at: "2026-01-01T12:00:00Z",
    }) as Record<string, unknown>;

  it("une label_details sem cor com labels ricos (refresh não perde cor)", () => {
    const dto = mapGitLabRestIssueJsonToSummaryDto(
      {
        ...baseIssue(),
        labels: [{ name: "bug", color: "#ff0000" }],
        label_details: [{ name: "bug", color: "" }],
      },
      "a/b",
    );
    expect(dto.labels).toEqual([{ name: "bug", color: "#ff0000" }]);
  });

  it("mapeia created_at para createdAt", () => {
    const dto = mapGitLabRestIssueJsonToSummaryDto(baseIssue(), "a/b");
    expect(dto.createdAt).toBe("2025-06-15T08:30:00Z");
    expect(dto.updatedAt).toBe("2026-01-01T12:00:00Z");
  });

  it("mapeia description para gitlabDescriptionMarkdown", () => {
    const dto = mapGitLabRestIssueJsonToSummaryDto(
      {
        ...baseIssue(),
        description: "## Contexto\n\nTexto com **markdown**.",
      },
      "a/b",
    );
    expect(dto.gitlabDescriptionMarkdown).toBe("## Contexto\n\nTexto com **markdown**.");
  });

  it("omite gitlabDescriptionMarkdown quando description vazia", () => {
    const dto = mapGitLabRestIssueJsonToSummaryDto(
      {
        ...baseIssue(),
        description: "   ",
      },
      "a/b",
    );
    expect(dto.gitlabDescriptionMarkdown).toBeUndefined();
  });

  it("labels como strings recebem cor de label_details quando existir", () => {
    const dto = mapGitLabRestIssueJsonToSummaryDto(
      {
        ...baseIssue(),
        labels: ["bug", "feature"],
        label_details: [
          { name: "bug", color: "#ff0000" },
          { name: "feature", color: "#00aa00" },
        ],
      },
      "a/b",
    );
    expect(dto.labels).toEqual([
      { name: "bug", color: "#ff0000" },
      { name: "feature", color: "#00aa00" },
    ]);
  });
});
