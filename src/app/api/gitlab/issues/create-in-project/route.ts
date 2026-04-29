import { NextResponse } from "next/server";
import type { GitLabCreateIssueInProjectResponseDto } from "@/lib/gitlab-create-issue-in-project-api-response-dto-types";
import {
  gitlabServerHttpPostJsonWithPrivateTokenAndTlsDevFlag,
  normalizeGitlabBaseUrl,
} from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";

function json(body: GitLabCreateIssueInProjectResponseDto, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status ?? (body.ok ? 201 : 400) });
}

function defaultCreateIssueProjectPath() {
  /** Path “namespace/projeto” como na URL web (ex.: portal-da-defensoria/portal-defensoria-gateway). */
  return (process.env.GITLAB_CREATE_ISSUE_PROJECT_PATH ?? "portal-da-defensoria/portal-defensoria-gateway").trim();
}

/** CSV de labels enviado ao GitLab em `POST .../issues` (parâmetro `labels`, nomes separados por vírgula). */
function normalizedCreateIssueDefaultLabelsCsvForGitlabApi(): string | null {
  const raw = (process.env.GITLAB_CREATE_ISSUE_DEFAULT_LABELS ?? "squad::bravo").trim();
  if (!raw) return null;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  return parts.join(",");
}

function buildMockCreateResponse(
  gitlabBaseUrl: string,
  projectPath: string,
): Extract<GitLabCreateIssueInProjectResponseDto, { ok: true }> {
  const base = normalizeGitlabBaseUrl(gitlabBaseUrl);
  const iid = 9000 + Math.floor(Math.random() * 999);
  const webUrl = `${base}/${projectPath}/-/issues/${iid}`;
  return {
    ok: true,
    issueUrl: webUrl,
    webUrl,
    iid,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "invalid_json", message: "Body JSON inválido." }, { status: 400 });
  }

  const titleRaw =
    typeof body === "object" && body && "title" in body ? (body as { title?: unknown }).title : null;
  const descriptionRaw =
    typeof body === "object" && body && "description" in body ? (body as { description?: unknown }).description : null;

  if (typeof titleRaw !== "string") {
    return json({ ok: false, code: "missing_title", message: "Informe `title` (string)." }, { status: 400 });
  }

  const title = titleRaw.trim();
  if (!title) {
    return json({ ok: false, code: "empty_title", message: "O título não pode ficar vazio." }, { status: 400 });
  }
  if (title.length > 255) {
    return json({ ok: false, code: "title_too_long", message: "Título acima de 255 caracteres." }, { status: 400 });
  }

  let description: string | undefined;
  if (descriptionRaw !== undefined && descriptionRaw !== null) {
    if (typeof descriptionRaw !== "string") {
      return json({ ok: false, code: "invalid_description", message: "`description` deve ser string ou omitido." }, { status: 400 });
    }
    const d = descriptionRaw.trim();
    if (d.length > 100_000) {
      return json({ ok: false, code: "description_too_long", message: "Descrição acima do limite suportado." }, { status: 400 });
    }
    description = d.length ? d : undefined;
  }

  const projectPath = defaultCreateIssueProjectPath();
  if (!projectPath) {
    return json(
      {
        ok: false,
        code: "create_project_not_configured",
        message: "Defina `GITLAB_CREATE_ISSUE_PROJECT_PATH` no servidor (path do projeto no GitLab).",
      },
      { status: 503 },
    );
  }

  const mockEnabled = process.env.GITLAB_MOCK === "1";
  const gitlabBaseUrl = process.env.GITLAB_BASE_URL;
  const gitlabToken = process.env.GITLAB_TOKEN;

  if (mockEnabled) {
    if (!gitlabBaseUrl) {
      return json(
        { ok: false, code: "gitlab_base_missing", message: "Com `GITLAB_MOCK=1`, defina `GITLAB_BASE_URL` para montar a URL da issue mock." },
        { status: 503 },
      );
    }
    return json(buildMockCreateResponse(gitlabBaseUrl, projectPath), { status: 201 });
  }

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

  const base = normalizeGitlabBaseUrl(gitlabBaseUrl);
  const projectEnc = encodeURIComponent(projectPath);
  const apiUrl = `${base}/api/v4/projects/${projectEnc}/issues`;
  const tlsInsecureDev = process.env.GITLAB_TLS_INSECURE_DEV === "1";

  const labelsForApi = normalizedCreateIssueDefaultLabelsCsvForGitlabApi();
  const upstreamPayload = JSON.stringify({
    title,
    ...(description ? { description } : {}),
    ...(labelsForApi ? { labels: labelsForApi } : {}),
  });

  const raw = await gitlabServerHttpPostJsonWithPrivateTokenAndTlsDevFlag(apiUrl, gitlabToken, tlsInsecureDev, upstreamPayload);

  if (!raw.ok) {
    const cause = raw.cause;
    const code =
      cause && typeof cause === "object" && "code" in cause ? String((cause as { code?: unknown }).code) : "";
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
            : "TLS ao GitLab falhou. Use NODE_EXTRA_CA_CERTS ou GITLAB_TLS_INSECURE_DEV=1 (só dev)."
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
        message: "O GitLab recusou criar a issue (401/403). Verifique escopos do token (ex.: `api`) e permissão no projeto.",
      },
      { status: 502 },
    );
  }

  if (upstreamStatus === 404) {
    return json(
      {
        ok: false,
        code: "gitlab_project_not_found",
        message: "Projeto não encontrado (404). Confira `GITLAB_CREATE_ISSUE_PROJECT_PATH` (path completo com subgrupos).",
      },
      { status: 404 },
    );
  }

  if (upstreamStatus < 200 || upstreamStatus >= 300) {
    let upstreamMessage = bodyText ? bodyText.slice(0, 800) : "";
    try {
      const parsed = JSON.parse(bodyText) as { message?: unknown };
      if (typeof parsed.message === "string") upstreamMessage = parsed.message;
    } catch {
      /* keep slice */
    }
    return json(
      {
        ok: false,
        code: "gitlab_upstream_error",
        message: `GitLab retornou HTTP ${upstreamStatus}. ${upstreamMessage}`.trim(),
      },
      { status: 502 },
    );
  }

  let jsonBody: Record<string, unknown>;
  try {
    jsonBody = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return json(
      { ok: false, code: "gitlab_invalid_json", message: "GitLab retornou resposta que não é JSON válido." },
      { status: 502 },
    );
  }

  const webUrl = typeof jsonBody.web_url === "string" ? jsonBody.web_url : null;
  const iidRaw = jsonBody.iid;
  const iid =
    typeof iidRaw === "number" && Number.isFinite(iidRaw)
      ? iidRaw
      : typeof iidRaw === "string"
        ? Number(iidRaw)
        : NaN;
  if (!webUrl || !Number.isFinite(iid)) {
    return json(
      { ok: false, code: "gitlab_missing_fields", message: "Resposta do GitLab sem `web_url` ou `iid`." },
      { status: 502 },
    );
  }

  return json({ ok: true, issueUrl: webUrl, webUrl, iid }, { status: 201 });
}
