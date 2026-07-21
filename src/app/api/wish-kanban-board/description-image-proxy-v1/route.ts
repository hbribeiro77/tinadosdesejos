import { NextResponse } from "next/server";
import { gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag } from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";
import {
  gitlabMarkdownUploadAssetServerFetchUrlIsAllowedV1,
  resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1,
} from "@/lib/resolve-gitlab-markdown-upload-asset-target-to-server-fetch-url-v1";
import { wishViewOnlyModeRejectIfEnabledAsNextResponseV1 } from "@/lib/wish-view-only-mode-json-error-response-v1";

function guessContentTypeFromPathname(pathname: string): string {
  const lower = pathname.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

/** Proxy de imagens referenciadas na descrição do card (rota da Tina, não do módulo GitLab). */
export async function GET(request: Request) {
  const viewOnlyRejected = wishViewOnlyModeRejectIfEnabledAsNextResponseV1();
  if (viewOnlyRejected) return viewOnlyRejected;

  const gitlabBaseUrl = process.env.GITLAB_BASE_URL;
  const gitlabToken = process.env.GITLAB_TOKEN;
  const mockEnabled = process.env.GITLAB_MOCK === "1";

  if (mockEnabled) {
    return NextResponse.json(
      { ok: false, code: "mock_mode", message: "Proxy de imagens indisponível em GITLAB_MOCK=1." },
      { status: 503 },
    );
  }

  if (!gitlabBaseUrl || !gitlabToken) {
    return NextResponse.json(
      { ok: false, code: "gitlab_not_configured", message: "GitLab não configurado no servidor." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl?.trim()) {
    return NextResponse.json(
      { ok: false, code: "missing_url", message: "Informe `url`." },
      { status: 400 },
    );
  }

  const projectPath = searchParams.get("projectPath");
  const fetchUrl =
    resolveGitlabMarkdownUploadAssetTargetToServerFetchUrlV1(rawUrl, {
      gitlabBaseUrl,
      gitlabProjectPath: projectPath,
    }) ?? rawUrl.trim();

  if (!gitlabMarkdownUploadAssetServerFetchUrlIsAllowedV1(fetchUrl, gitlabBaseUrl)) {
    return NextResponse.json(
      { ok: false, code: "url_not_allowed", message: "URL de asset não permitida para proxy." },
      { status: 400 },
    );
  }

  const tlsInsecureDev = process.env.GITLAB_TLS_INSECURE_DEV === "1";

  const raw = await gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag(
    fetchUrl,
    gitlabToken,
    tlsInsecureDev,
  );

  if (!raw.ok) {
    return NextResponse.json(
      { ok: false, code: "upstream_fetch_failed", message: "Falha ao buscar imagem." },
      { status: 502 },
    );
  }

  if (raw.status < 200 || raw.status >= 300) {
    return NextResponse.json(
      { ok: false, code: "upstream_error", message: `Origem retornou HTTP ${raw.status}.` },
      { status: 502 },
    );
  }

  const pathname = new URL(fetchUrl).pathname;
  const contentType = raw.contentType ?? guessContentTypeFromPathname(pathname);

  // Uint8Array: BodyInit do Next/undici não aceita Buffer tipado do Node em alguns TS.
  return new NextResponse(new Uint8Array(raw.body), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
