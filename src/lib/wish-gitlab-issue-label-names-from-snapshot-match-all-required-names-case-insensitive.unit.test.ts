import { describe, expect, it } from "vitest";
import { wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive } from "@/lib/wish-gitlab-issue-label-names-from-snapshot-match-all-required-names-case-insensitive";

describe("wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive", () => {
  it("aceita bug vs Bug", () => {
    expect(
      wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive(
        ["Triagem de issues", "bug", "squad::bravo"],
        ["Triagem de issues", "Bug"],
      ),
    ).toBe(true);
  });

  it("falta label obrigatória", () => {
    expect(
      wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive(["Triagem de issues"], [
        "Triagem de issues",
        "Bug",
      ]),
    ).toBe(false);
  });

  it("required vazio retorna false", () => {
    expect(wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive(["a"], [])).toBe(false);
  });
});
