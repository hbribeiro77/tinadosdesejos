import { describe, expect, it } from "vitest";
import {
  wishGitlabProjectUploadImageFileIsAllowedV1,
  wishGitlabProjectUploadParseMarkdownFromUploadApiJsonV1,
} from "@/lib/wish-gitlab-project-upload-image-validate-and-parse-markdown-from-api-json-v1";

describe("wishGitlabProjectUploadImageFileIsAllowedV1", () => {
  it("aceita png/jpeg/gif/webp e rejeita outros", () => {
    expect(wishGitlabProjectUploadImageFileIsAllowedV1({ mimeType: "image/png", byteLength: 100 })).toBe(
      true,
    );
    expect(wishGitlabProjectUploadImageFileIsAllowedV1({ mimeType: "image/jpeg", byteLength: 100 })).toBe(
      true,
    );
    expect(wishGitlabProjectUploadImageFileIsAllowedV1({ mimeType: "application/pdf", byteLength: 100 })).toBe(
      false,
    );
    expect(
      wishGitlabProjectUploadImageFileIsAllowedV1({ mimeType: "image/png", byteLength: 20 * 1024 * 1024 }),
    ).toBe(false);
  });
});

describe("wishGitlabProjectUploadParseMarkdownFromUploadApiJsonV1", () => {
  it("extrai markdown do JSON do GitLab", () => {
    expect(
      wishGitlabProjectUploadParseMarkdownFromUploadApiJsonV1({
        markdown: "![image](/uploads/abc/image.png)",
        url: "/uploads/abc/image.png",
      }),
    ).toBe("![image](/uploads/abc/image.png)");
    expect(wishGitlabProjectUploadParseMarkdownFromUploadApiJsonV1({ url: "/uploads/x.png" })).toBe(
      "![image](/uploads/x.png)",
    );
    expect(wishGitlabProjectUploadParseMarkdownFromUploadApiJsonV1(null)).toBeNull();
  });
});
