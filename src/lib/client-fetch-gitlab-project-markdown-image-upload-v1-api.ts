import type { WishGitlabProjectMarkdownImageUploadResponseDtoV1 } from "@/lib/wish-gitlab-project-markdown-image-upload-api-response-dto-types-v1";

export async function clientFetchGitlabProjectMarkdownImageUploadV1(
  file: File,
): Promise<WishGitlabProjectMarkdownImageUploadResponseDtoV1> {
  const body = new FormData();
  body.append("file", file, file.name || "image.png");

  try {
    const response = await fetch("/api/gitlab/project-markdown-image-upload-v1", {
      method: "POST",
      body,
      cache: "no-store",
    });
    const json = (await response.json().catch(() => null)) as WishGitlabProjectMarkdownImageUploadResponseDtoV1 | null;
    if (!json || typeof json !== "object") {
      return { ok: false, message: `Resposta inválida ao enviar imagem (HTTP ${response.status}).` };
    }
    if (!response.ok || !("ok" in json) || json.ok !== true) {
      return {
        ok: false,
        code: "code" in json && typeof json.code === "string" ? json.code : undefined,
        message:
          "message" in json && typeof json.message === "string"
            ? json.message
            : `HTTP ${response.status}`,
      };
    }
    return { ok: true, markdown: json.markdown };
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Falha de rede ao enviar imagem.",
    };
  }
}
