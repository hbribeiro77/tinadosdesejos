export type WishGitlabProjectMarkdownImageUploadResponseDtoV1 =
  | { ok: true; markdown: string }
  | { ok: false; code?: string; message: string };
