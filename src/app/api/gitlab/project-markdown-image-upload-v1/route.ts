import { NextResponse } from "next/server";
import type { WishGitlabProjectMarkdownImageUploadResponseDtoV1 } from "@/lib/wish-gitlab-project-markdown-image-upload-api-response-dto-types-v1";
import {
  gitlabServerHttpPostMultipartFormDataWithPrivateTokenAndTlsDevFlag,
  normalizeGitlabBaseUrl,
} from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";
import {
  wishGitlabProjectUploadImageFileIsAllowedV1,
  wishGitlabProjectUploadParseMarkdownFromUploadApiJsonV1,
} from "@/lib/wish-gitlab-project-upload-image-validate-and-parse-markdown-from-api-json-v1";
import { wishViewOnlyModeRejectIfEnabledAsNextResponseV1 } from "@/lib/wish-view-only-mode-json-error-response-v1";

function json(body: WishGitlabProjectMarkdownImageUploadResponseDtoV1, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status ?? (body.ok ? 200 : 400) });
}

function defaultCreateIssueProjectPath() {
  return (process.env.GITLAB_CREATE_ISSUE_PROJECT_PATH ?? "portal-da-defensoria/portal-defensoria-gateway").trim();
}

export async function POST(request: Request) {
  const viewOnlyRejected = wishViewOnlyModeRejectIfEnabledAsNextResponseV1();
  if (viewOnlyRejected) return viewOnlyRejected;

  const mockEnabled = process.env.GITLAB_MOCK === "1";
  const gitlabBaseUrl = process.env.GITLAB_BASE_URL;
  const gitlabToken = process.env.GITLAB_TOKEN;
  const projectPath = defaultCreateIssueProjectPath();

  if (!projectPath) {
    return json(
      {
        ok: false,
        code: "create_project_not_configured",
        message: "Defina `GITLAB_CREATE_ISSUE_PROJECT_PATH` no servidor.",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, code: "invalid_form", message: "Body multipart inválido." }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return json(
      { ok: false, code: "missing_file", message: "Envie o campo `file` (imagem)." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await fileEntry.arrayBuffer());
  if (
    !wishGitlabProjectUploadImageFileIsAllowedV1({
      mimeType: fileEntry.type || "application/octet-stream",
      byteLength: bytes.length,
    })
  ) {
    return json(
      {
        ok: false,
        code: "invalid_image",
        message: "Imagem inválida. Use PNG, JPEG, GIF ou WebP até 12 MB.",
      },
      { status: 400 },
    );
  }

  if (mockEnabled) {
    const safeName = (fileEntry.name || "image.png").replace(/[^\w.\-]+/g, "_");
    return json({
      ok: true,
      markdown: `![${safeName}](/uploads/mockuploadhash/${safeName})`,
    });
  }

  if (!gitlabBaseUrl || !gitlabToken) {
    return json(
      {
        ok: false,
        code: "gitlab_not_configured",
        message: "GitLab não configurado. Defina `GITLAB_BASE_URL` e `GITLAB_TOKEN`, ou `GITLAB_MOCK=1`.",
      },
      { status: 503 },
    );
  }

  const base = normalizeGitlabBaseUrl(gitlabBaseUrl);
  const projectEnc = encodeURIComponent(projectPath);
  const apiUrl = `${base}/api/v4/projects/${projectEnc}/uploads`;
  const tlsInsecureDev = process.env.GITLAB_TLS_INSECURE_DEV === "1";

  const upstreamForm = new FormData();
  const blob = new Blob([new Uint8Array(bytes)], { type: fileEntry.type || "application/octet-stream" });
  upstreamForm.append("file", blob, fileEntry.name || "image.png");

  const raw = await gitlabServerHttpPostMultipartFormDataWithPrivateTokenAndTlsDevFlag(
    apiUrl,
    gitlabToken,
    tlsInsecureDev,
    upstreamForm,
  );

  if (!raw.ok) {
    return json(
      {
        ok: false,
        code: "gitlab_fetch_failed",
        message: `Falha ao enviar imagem ao GitLab: ${raw.cause instanceof Error ? raw.cause.message : String(raw.cause)}`,
      },
      { status: 502 },
    );
  }

  if (raw.status === 401 || raw.status === 403) {
    return json(
      {
        ok: false,
        code: "gitlab_unauthorized",
        message: "GitLab recusou o upload (401/403). Verifique o token e permissão no projeto.",
      },
      { status: 502 },
    );
  }

  if (raw.status < 200 || raw.status >= 300) {
    let upstreamMessage = raw.bodyText ? raw.bodyText.slice(0, 400) : "";
    try {
      const parsed = JSON.parse(raw.bodyText) as { message?: unknown };
      if (typeof parsed.message === "string") upstreamMessage = parsed.message;
    } catch {
      /* keep */
    }
    return json(
      {
        ok: false,
        code: "gitlab_upstream_error",
        message: `GitLab retornou HTTP ${raw.status}. ${upstreamMessage}`.trim(),
      },
      { status: 502 },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw.bodyText) as unknown;
  } catch {
    return json(
      { ok: false, code: "gitlab_invalid_json", message: "Resposta do upload não é JSON válido." },
      { status: 502 },
    );
  }

  const markdown = wishGitlabProjectUploadParseMarkdownFromUploadApiJsonV1(parsedJson);
  if (!markdown) {
    return json(
      { ok: false, code: "gitlab_missing_markdown", message: "Upload ok, mas sem markdown na resposta." },
      { status: 502 },
    );
  }

  return json({ ok: true, markdown });
}
