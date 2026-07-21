import { NextResponse } from "next/server";
import type { GitLabIssueResolveResponse, GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import {
  gitlabServerHttpGetWithPrivateTokenAndTlsDevFlag,
  normalizeGitlabBaseUrl,
} from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";
import { mapGitLabRestIssueJsonToSummaryDto } from "@/lib/map-gitlab-rest-issue-json-to-summary-dto";
import { GitLabIssueUrlParseError, parseGitLabIssueUrl } from "@/lib/parse-gitlab-issue-url";
import {
  mergeGitLabIssueSummaryDtoLabelsWithProjectLabelColorLookup,
  wishGitlabRestFetchProjectLabelNameToHexColorMap,
} from "@/lib/wish-gitlab-rest-fetch-project-label-name-to-hex-color-map-for-resolve-enrichment";
import { enrichGitLabIssueSummaryDtoWithMirroredDescriptionUploadAssetsOnServerV1 } from "@/lib/mirror-gitlab-issue-description-upload-assets-to-local-data-directory-and-rewrite-markdown-on-server-v1";
import { wishViewOnlyModeRejectIfEnabledAsNextResponseV1 } from "@/lib/wish-view-only-mode-json-error-response-v1";

function json(body: GitLabIssueResolveResponse, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status ?? (body.ok ? 200 : 400) });
}

function getHostMismatchError(): GitLabIssueResolveResponse {
  return {
    ok: false,
    code: "host_mismatch",
    message:
      "O host da URL da issue não bate com `GITLAB_BASE_URL`. Isso bloqueia uso acidental de links externos.",
  };
}

function buildMockSummary(parsed: ReturnType<typeof parseGitLabIssueUrl>): GitLabIssueSummaryDto {
  const now = new Date().toISOString();
  return {
    iid: parsed.iid,
    title: `[MOCK] Issue ${parsed.projectPath}#${parsed.iid}`,
    state: "opened",
    webUrl: `${parsed.origin}/${parsed.projectPath}/-/issues/${parsed.iid}`,
    projectPath: parsed.projectPath,
    labels: [{ name: "mock", color: "rgb(108, 163, 255)" }],
    assignees: [{ name: "Mock User", username: "mock.user", avatarUrl: null }],
    createdAt: now,
    updatedAt: now,
    gitlabDescriptionMarkdown: `[MOCK] Descrição da issue **#${parsed.iid}** no projeto \`${parsed.projectPath}\`.\n\nAtualize o card para sincronizar a descrição real do GitLab.`,
  };
}

export async function POST(request: Request) {
  const viewOnlyRejected = wishViewOnlyModeRejectIfEnabledAsNextResponseV1();
  if (viewOnlyRejected) return viewOnlyRejected;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "invalid_json", message: "Body JSON inválido." }, { status: 400 });
  }

  const issueUrl = typeof body === "object" && body && "issueUrl" in body ? (body as { issueUrl?: unknown }).issueUrl : null;
  if (typeof issueUrl !== "string" || !issueUrl.trim()) {
    return json({ ok: false, code: "missing_issue_url", message: "Informe `issueUrl`." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseGitLabIssueUrl(issueUrl);
  } catch (cause) {
    if (cause instanceof GitLabIssueUrlParseError) {
      return json({ ok: false, code: cause.code, message: cause.message }, { status: 400 });
    }
    return json({ ok: false, code: "parse_failed", message: "Não foi possível interpretar a URL." }, { status: 400 });
  }

  const issueOriginUrl = new URL(parsed.origin);

  const mockEnabled = process.env.GITLAB_MOCK === "1";
  if (mockEnabled) {
    return json({ ok: true, data: buildMockSummary(parsed) });
  }

  const gitlabBaseUrl = process.env.GITLAB_BASE_URL;
  const gitlabToken = process.env.GITLAB_TOKEN;

  if (!gitlabBaseUrl || !gitlabToken) {
    return json(
      {
        ok: false,
        code: "gitlab_not_configured",
        message:
          "GitLab não configurado no servidor. Defina `GITLAB_BASE_URL` e `GITLAB_TOKEN`, ou use `GITLAB_MOCK=1` para desenvolvimento.",
      },
      { status: 503 },
    );
  }

  const baseUrlForCompare = new URL(normalizeGitlabBaseUrl(gitlabBaseUrl));
  if (issueOriginUrl.origin !== baseUrlForCompare.origin) {
    return json(getHostMismatchError(), { status: 400 });
  }

  const base = normalizeGitlabBaseUrl(gitlabBaseUrl);
  const projectEnc = encodeURIComponent(parsed.projectPath);
  const apiUrl = `${base}/api/v4/projects/${projectEnc}/issues/${parsed.iid}?with_labels_details=true`;

  const tlsInsecureDev = process.env.GITLAB_TLS_INSECURE_DEV === "1";

  const raw = await gitlabServerHttpGetWithPrivateTokenAndTlsDevFlag(apiUrl, gitlabToken, tlsInsecureDev);
  if (!raw.ok) {
    const cause = raw.cause;
    const code =
      cause && typeof cause === "object" && "code" in cause
        ? String((cause as { code?: unknown }).code)
        : "";
    const hintTls =
      code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
      code === "SELF_SIGNED_CERT_IN_CHAIN" ||
      code === "CERT_HAS_EXPIRED";
    return json(
      {
        ok: false,
        code: "gitlab_fetch_failed",
        message: hintTls
          ? tlsInsecureDev
            ? "Falha TLS ao chamar o GitLab mesmo com GITLAB_TLS_INSECURE_DEV=1. Confira URL, rede e token."
            : "O Node não confiou no certificado do GitLab (TLS). Soluções: (1) subir o dev com NODE_EXTRA_CA_CERTS apontando para o PEM da CA interna; ou (2) só em máquina local, defina GITLAB_TLS_INSECURE_DEV=1 no .env.local (nunca em produção)."
          : `Falha ao chamar o GitLab: ${cause instanceof Error ? cause.message : String(cause)}`,
      },
      { status: 502 },
    );
  }

  const upstreamStatus = raw.status;
  const bodyText = raw.bodyText;

  if (upstreamStatus === 401 || upstreamStatus === 403) {
    return json(
      {
        ok: false,
        code: "gitlab_unauthorized",
        message: "O GitLab recusou o token (401/403). Verifique escopos/permissões do token.",
      },
      { status: 502 },
    );
  }

  if (upstreamStatus === 404) {
    return json(
      {
        ok: false,
        code: "gitlab_not_found",
        message: "Issue não encontrada (404). Confira projeto/IID e permissões.",
      },
      { status: 404 },
    );
  }

  if (upstreamStatus < 200 || upstreamStatus >= 300) {
    return json(
      {
        ok: false,
        code: "gitlab_upstream_error",
        message: `GitLab retornou HTTP ${upstreamStatus}. ${bodyText ? bodyText.slice(0, 500) : ""}`.trim(),
      },
      { status: 502 },
    );
  }

  let jsonBody: Record<string, unknown>;
  try {
    jsonBody = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return json(
      {
        ok: false,
        code: "gitlab_upstream_error",
        message: "GitLab retornou resposta que não é JSON válido.",
      },
      { status: 502 },
    );
  }

  let data = mapGitLabRestIssueJsonToSummaryDto(jsonBody, parsed.projectPath);

  /** GET issue costuma vir só com nomes nas labels; a triagem usa lista de issues com detalhes ricos.
   * Repete a mesma informação de cor buscando o catálogo de labels do projeto (+ ancestrais). */
  if (data.labels.some((l) => !l.color)) {
    const colorByName = await wishGitlabRestFetchProjectLabelNameToHexColorMap({
      gitlabBaseUrl,
      projectPath: parsed.projectPath,
      token: gitlabToken,
      tlsInsecureDev,
    });
    data = mergeGitLabIssueSummaryDtoLabelsWithProjectLabelColorLookup(data, colorByName);
  }

  data = await enrichGitLabIssueSummaryDtoWithMirroredDescriptionUploadAssetsOnServerV1(data, {
    gitlabBaseUrl,
    token: gitlabToken,
    tlsInsecureDev,
  });

  return json({ ok: true, data });
}
