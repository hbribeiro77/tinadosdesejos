import { describe, expect, it } from "vitest";
import {
  normalizeCommaSeparatedGitlabImportLabelsCsv,
  parseGitLabImportLabelsCsvFromTriageGroupListBody,
} from "@/lib/parse-gitlab-import-labels-csv-from-triage-group-list-request-body";

describe("normalizeCommaSeparatedGitlabImportLabelsCsv", () => {
  it("trim e vírgulas", () => {
    expect(normalizeCommaSeparatedGitlabImportLabelsCsv(" a , b , c ")).toBe("a,b,c");
  });
});

describe("parseGitLabImportLabelsCsvFromTriageGroupListBody", () => {
  it("labelsCsv string", () => {
    expect(parseGitLabImportLabelsCsvFromTriageGroupListBody({ labelsCsv: " bug , feature " })).toBe(
      "bug,feature",
    );
  });

  it("labels array", () => {
    expect(parseGitLabImportLabelsCsvFromTriageGroupListBody({ labels: ["bug", " x "] })).toBe("bug,x");
  });

  it("vazio → null", () => {
    expect(parseGitLabImportLabelsCsvFromTriageGroupListBody({ labelsCsv: "  , , " })).toBe(null);
  });
});
