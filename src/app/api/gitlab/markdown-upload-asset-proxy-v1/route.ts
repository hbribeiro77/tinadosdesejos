import { NextResponse } from "next/server";
import { gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag } from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";
import { gitlabMarkdownUploadAssetAbsoluteUrlIsAllowedForServerProxyV1 } from "@/lib/gitlab-markdown-upload-asset-url-is-allowed-for-server-proxy-v1";
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

  if (!gitlabMarkdownUploadAssetAbsoluteUrlIsAllowedForServerProxyV1(rawUrl, gitlabBaseUrl)) {
    return NextResponse.json(
      { ok: false, code: "url_not_allowed", message: "URL de asset não permitida para proxy." },
      { status: 400 },
    );
  }

  const tlsInsecureDev = process.env.GITLAB_TLS_INSECURE_DEV === "1";
  const assetUrl = rawUrl.trim();

  const raw = await gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag(
    assetUrl,
    gitlabToken,
    tlsInsecureDev,
  );

  if (!raw.ok) {
    return NextResponse.json(
      { ok: false, code: "gitlab_fetch_failed", message: "Falha ao buscar asset no GitLab." },
      { status: 502 },
    );
  }

  if (raw.status < 200 || raw.status >= 300) {
    return NextResponse.json(
      { ok: false, code: "gitlab_upstream_error", message: `GitLab retornou HTTP ${raw.status}.` },
      { status: 502 },
    );
  }

  const pathname = new URL(assetUrl).pathname;
  const contentType = raw.contentType ?? guessContentTypeFromPathname(pathname);

  return new NextResponse(raw.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
