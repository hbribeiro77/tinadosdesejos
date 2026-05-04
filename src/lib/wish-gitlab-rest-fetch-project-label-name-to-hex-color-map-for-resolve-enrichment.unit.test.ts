import { describe, expect, it } from "vitest";
import { mergeGitLabIssueSummaryDtoLabelsWithProjectLabelColorLookup } from "@/lib/wish-gitlab-rest-fetch-project-label-name-to-hex-color-map-for-resolve-enrichment";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";

describe("mergeGitLabIssueSummaryDtoLabelsWithProjectLabelColorLookup", () => {
  it("preenche cor ausente a partir do mapa do projeto; mantém cor que já veio da issue", () => {
    const dto: GitLabIssueSummaryDto = {
      iid: 1,
      title: "t",
      state: "opened",
      webUrl: "x",
      projectPath: "a/b",
      labels: [
        { name: "bug", color: null },
        { name: "kept", color: "#00ff00" },
        { name: "us", color: null },
      ],
      assignees: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const m = new Map<string, string>([
      ["bug", "#ff0000"],
      ["us", "#0000ff"],
    ]);
    const out = mergeGitLabIssueSummaryDtoLabelsWithProjectLabelColorLookup(dto, m);
    expect(out.labels).toEqual([
      { name: "bug", color: "#ff0000" },
      { name: "kept", color: "#00ff00" },
      { name: "us", color: "#0000ff" },
    ]);
  });
});
