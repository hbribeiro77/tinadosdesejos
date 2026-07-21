import { describe, expect, it } from "vitest";
import { wishGitlabDescriptionUploadedAssetFileNameFromAbsoluteUrlV1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-from-absolute-url-v1";

describe("wishGitlabDescriptionUploadedAssetFileNameFromAbsoluteUrlV1", () => {
  it("gera hash estável com extensão da URL", () => {
    const url = "https://gitlab.example.com/proj/uploads/abc/image.png";
    const a = wishGitlabDescriptionUploadedAssetFileNameFromAbsoluteUrlV1(url);
    const b = wishGitlabDescriptionUploadedAssetFileNameFromAbsoluteUrlV1(url);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}\.png$/);
  });
});
