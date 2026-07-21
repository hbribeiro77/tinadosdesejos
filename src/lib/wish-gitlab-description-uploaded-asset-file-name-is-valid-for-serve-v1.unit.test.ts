import { describe, expect, it } from "vitest";
import { wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-is-valid-for-serve-v1";

describe("wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1", () => {
  it("aceita nome hash.ext seguro", () => {
    const name = `${"a".repeat(64)}.png`;
    expect(wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1(name)).toBe(true);
  });

  it("rejeita path traversal e extensões inválidas", () => {
    expect(wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1("../etc/passwd")).toBe(false);
    expect(wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1(`${"a".repeat(64)}.exe`)).toBe(false);
    expect(wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1("short.png")).toBe(false);
  });
});
