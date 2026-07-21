import { NextResponse } from "next/server";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import type { GitLabTriageGroupIssuesListResponse } from "@/lib/gitlab-triage-group-issues-list-response-types";
import {
  gitlabServerHttpGetWithPrivateTokenAndTlsDevFlag,
  normalizeGitlabBaseUrl,
} from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";
import { mapGitLabIssueJsonToSummaryDtoUsingIssueWebUrl } from "@/lib/map-gitlab-issue-json-to-summary-dto-using-issue-web-url";
import { parseGitLabImportLabelsCsvFromTriageGroupListBody } from "@/lib/parse-gitlab-import-labels-csv-from-triage-group-list-request-body";
import { wishViewOnlyModeRejectIfEnabledAsNextResponseV1 } from "@/lib/wish-view-only-mode-json-error-response-v1";

function json(body: GitLabTriageGroupIssuesListResponse, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status ?? (body.ok ? 200 : 400) });
}

function buildMockTriageIssues(baseUrl: string): GitLabIssueSummaryDto[] {
  const origin = normalizeGitlabBaseUrl(baseUrl);
  const p = "portal-da-defensoria/exemplo-projeto";
  const t = new Date().toISOString();
  return [
    {
      gitlabIssueId: 900001,
      iid: 1,
      title: "[MOCK] Issue de triagem A",
      state: "opened",
      webUrl: `${origin}/${p}/-/issues/1`,
      projectPath: p,
      labels: [{ name: "Triagem de issues", color: null }],
      assignees: [],
      createdAt: t,
      updatedAt: t,
    },
    {
      gitlabIssueId: 900002,
      iid: 2,
      title: "[MOCK] Issue de triagem B",
      state: "opened",
      webUrl: `${origin}/${p}/-/issues/2`,
      projectPath: p,
      labels: [{ name: "Triagem de issues", color: null }],
      assignees: [],
      createdAt: t,
      updatedAt: t,
    },
  ];
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

  const pageRaw =
    typeof body === "object" && body && "page" in body ? (body as { page?: unknown }).page : 1;
  const page = typeof pageRaw === "number" && Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  const perPageRaw =
    typeof body === "object" && body && "perPage" in body ? (body as { perPage?: unknown }).perPage : 30;
  const perPage =
    typeof perPageRaw === "number" && Number.isFinite(perPageRaw)
      ? Math.min(100, Math.max(1, Math.floor(perPageRaw)))
      : 30;

  const mockEnabled = process.env.GITLAB_MOCK === "1";
  const gitlabBaseUrl = process.env.GITLAB_BASE_URL;
  const gitlabToken = process.env.GITLAB_TOKEN;

  if (mockEnabled) {
    const base = gitlabBaseUrl ? normalizeGitlabBaseUrl(gitlabBaseUrl) : "https://gitlab.example.local";
    return json({
      ok: true,
      issues: buildMockTriageIssues(base),
      page,
      perPage,
      nextPage: null,
    });
  }

  if (!gitlabBaseUrl || !gitlabToken) {
    return json(
      {
        ok: false,
        code: "gitlab_not_configured",
        message:
          "GitLab não configurado no servidor. Defina `GITLAB_BASE_URL` e `GITLAB_TOKEN`, ou use `GITLAB_MOCK=1`.",
      },
      { status: 503 },
    );
  }

  const groupPath = (process.env.GITLAB_TRIAGE_GROUP_PATH ?? "portal-da-defensoria").trim();
  const envLabelFallback = (process.env.GITLAB_TRIAGE_LABEL ?? "Triagem de issues").trim();

  const fromClient = parseGitLabImportLabelsCsvFromTriageGroupListBody(body);
  const MAX_LABELS_CSV = 2000;
  if (fromClient && fromClient.length > MAX_LABELS_CSV) {
    return json(
      {
        ok: false,
        code: "labels_csv_too_long",
        message: "Lista de labels excede o tamanho máximo permitido.",
      },
      { status: 400 },
    );
  }

  const labelsForGitLabApi = fromClient && fromClient.length ? fromClient : envLabelFallback;

  if (!groupPath || !labelsForGitLabApi) {
    return json(
      {
        ok: false,
        code: "triage_config_invalid",
        message: "Defina `GITLAB_TRIAGE_GROUP_PATH` (e `GITLAB_TRIAGE_LABEL` no servidor ou labels na requisição).",
      },
      { status: 500 },
    );
  }

  const base = normalizeGitlabBaseUrl(gitlabBaseUrl);
  const tlsInsecureDev = process.env.GITLAB_TLS_INSECURE_DEV === "1";

  const groupEnc = encodeURIComponent(groupPath);
  const params = new URLSearchParams({
    state: "opened",
    labels: labelsForGitLabApi,
    include_subgroups: "true",
    order_by: "updated_at",
    sort: "desc",
    with_labels_details: "true",
    page: String(page),
    per_page: String(perPage),
    scope: "all",
  });

  const apiUrl = `${base}/api/v4/groups/${groupEnc}/issues?${params.toString()}`;

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
            ? "Falha TLS ao chamar o GitLab mesmo com GITLAB_TLS_INSECURE_DEV=1."
            : "Falha TLS ao chamar o GitLab. Use NODE_EXTRA_CA_CERTS ou GITLAB_TLS_INSECURE_DEV=1 (só dev)."
          : `Falha ao chamar o GitLab: ${cause instanceof Error ? cause.message : String(cause)}`,
      },
      { status: 502 },
    );
  }

  if (raw.status === 401 || raw.status === 403) {
    return json(
      {
        ok: false,
        code: "gitlab_unauthorized",
        message: "O GitLab recusou o token (401/403). Verifique escopos/permissões do token.",
      },
      { status: 502 },
    );
  }

  if (raw.status < 200 || raw.status >= 300) {
    return json(
      {
        ok: false,
        code: "gitlab_upstream_error",
        message: `GitLab retornou HTTP ${raw.status}. ${raw.bodyText ? raw.bodyText.slice(0, 500) : ""}`.trim(),
      },
      { status: 502 },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw.bodyText) as unknown;
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

  if (!Array.isArray(parsedJson)) {
    return json(
      {
        ok: false,
        code: "gitlab_upstream_error",
        message: "Resposta inesperada do GitLab (esperado array de issues).",
      },
      { status: 502 },
    );
  }

  const issues = parsedJson
    .map((row) => mapGitLabIssueJsonToSummaryDtoUsingIssueWebUrl(row as Record<string, unknown>))
    .filter(Boolean) as GitLabIssueSummaryDto[];

  const nextPage = issues.length < perPage ? null : page + 1;

  return json({
    ok: true,
    issues,
    page,
    perPage,
    nextPage,
  });
}
