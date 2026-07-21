import { NextResponse } from "next/server";
import type { GitLabApplyDvituScoringToGitlabIssueResponseDto } from "@/lib/gitlab-apply-dvitu-scoring-to-gitlab-issue-api-response-dto-types";
import {
  gitlabDvituBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1,
  type GitlabDvituScoresForMarkdownBlockV1,
} from "@/lib/gitlab-dvitu-build-markdown-append-block-collapsed-details-with-score-table-v1";
import { gitlabDvituComputeProductFromDvitUScores } from "@/lib/gitlab-dvitu-compute-product-and-partial-product-from-d-v-i-t-u-scores";
import {
  gitlabDvituAppliedLabelNameFromEnv,
  gitlabDvituRequiredIssueLabelNamesForPlayButtonAndSubmitFromEnv,
  gitlabDvituTriageLabelNamesFromEnvCsvForRemoval,
} from "@/lib/gitlab-dvitu-read-required-label-names-from-env-for-eligibility-and-removal";
import { gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle } from "@/lib/gitlab-dvitu-strip-leading-dvitu-bracket-note-prefix-from-issue-title";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import {
  gitlabServerHttpPutJsonWithPrivateTokenAndTlsDevFlag,
  normalizeGitlabBaseUrl,
} from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";
import { gitlabRestFetchIssueSummaryDtoWithRawIssueJsonForServer } from "@/lib/gitlab-rest-fetch-issue-summary-dto-with-raw-issue-json-for-server";
import { gitlabApplyDvituScoringRequestBodySchema } from "@/lib/parse-gitlab-apply-dvitu-scoring-request-body-with-zod";
import { GitLabIssueUrlParseError, parseGitLabIssueUrl } from "@/lib/parse-gitlab-issue-url";
import { wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive } from "@/lib/wish-gitlab-issue-label-names-from-snapshot-match-all-required-names-case-insensitive";
import { db } from "@/db/client";
import { triageHistory } from "@/db/schema";
import crypto from "crypto";
import { wishViewOnlyModeRejectIfEnabledAsNextResponseV1 } from "@/lib/wish-view-only-mode-json-error-response-v1";

function json(body: GitLabApplyDvituScoringToGitlabIssueResponseDto, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status ?? (body.ok ? 200 : 400) });
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildMockDvituAppliedSummary(
  parsed: ReturnType<typeof parseGitLabIssueUrl>,
  scores: { d: number; v: number; i: number; t: number; u: number },
): GitLabIssueSummaryDto {
  const now = new Date().toISOString();
  const product = gitlabDvituComputeProductFromDvitUScores(scores);
  const oldTitle = `[MOCK] Issue ${parsed.projectPath}#${parsed.iid}`;
  const baseTitle = gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle(oldTitle);
  return {
    iid: parsed.iid,
    title: `[DVITU: ${product}] ${baseTitle}`,
    state: "opened",
    webUrl: `${parsed.origin}/${parsed.projectPath}/-/issues/${parsed.iid}`,
    projectPath: parsed.projectPath,
    labels: [{ name: gitlabDvituAppliedLabelNameFromEnv(), color: "rgb(108, 163, 255)" }],
    assignees: [{ name: "Mock User", username: "mock.user", avatarUrl: null }],
    createdAt: now,
    updatedAt: now,
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

  const parsedBody = gitlabApplyDvituScoringRequestBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return json(
      {
        ok: false,
        code: "invalid_body",
        message: parsedBody.error.issues.map((i) => i.message).join("; ") || "Body inválido.",
      },
      { status: 400 },
    );
  }

  const { issueUrl, d, v, i, t, u, explanationD, explanationV, explanationI, explanationT, explanationU } = parsedBody.data;
  const scores = { d, v, i, t, u };
  const explanations = {
    d: explanationD,
    v: explanationV,
    i: explanationI,
    t: explanationT,
    u: explanationU,
  };

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
    if (!process.env.GITLAB_BASE_URL) {
      return json(
        {
          ok: false,
          code: "gitlab_base_missing",
          message: "Com `GITLAB_MOCK=1`, defina `GITLAB_BASE_URL` para validar o host da URL.",
        },
        { status: 503 },
      );
    }
  }

  const gitlabBaseUrl = process.env.GITLAB_BASE_URL;
  const gitlabToken = process.env.GITLAB_TOKEN;

  if (!mockEnabled && (!gitlabBaseUrl || !gitlabToken)) {
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

  if (!gitlabBaseUrl) {
    return json({ ok: false, code: "gitlab_not_configured", message: "Defina `GITLAB_BASE_URL` no servidor." }, { status: 503 });
  }

  const baseUrlForCompare = new URL(normalizeGitlabBaseUrl(gitlabBaseUrl));
  if (issueOriginUrl.origin !== baseUrlForCompare.origin) {
    return json(
      {
        ok: false,
        code: "host_mismatch",
        message:
          "O host da URL da issue não bate com `GITLAB_BASE_URL`. Isso bloqueia uso acidental de links externos.",
      },
      { status: 400 },
    );
  }

  if (mockEnabled) {
    return json({ ok: true, data: buildMockDvituAppliedSummary(parsed, scores) });
  }

  const tlsInsecureDev = process.env.GITLAB_TLS_INSECURE_DEV === "1";
  const base = normalizeGitlabBaseUrl(gitlabBaseUrl);
  const projectEnc = encodeURIComponent(parsed.projectPath);
  const issueApiBase = `${base}/api/v4/projects/${projectEnc}/issues/${parsed.iid}`;

  const first = await gitlabRestFetchIssueSummaryDtoWithRawIssueJsonForServer({
    gitlabBaseUrl,
    projectPath: parsed.projectPath,
    iid: parsed.iid,
    token: gitlabToken!,
    tlsInsecureDev,
  });

  if (!first.ok) {
    return json({ ok: false, code: first.code, message: first.message }, { status: first.httpStatus });
  }

  const labelNames = first.data.labels.map((l) => l.name);
  const required = gitlabDvituRequiredIssueLabelNamesForPlayButtonAndSubmitFromEnv();
  if (!wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive(labelNames, required)) {
    const lower = new Set(labelNames.map((n) => n.trim().toLowerCase()));
    const missing = required.filter((r) => !lower.has(r.trim().toLowerCase()));
    return json(
      {
        ok: false,
        code: "dvitu_issue_not_eligible",
        message: `A issue não está elegível para DVITU (faltam labels: ${missing.join(", ")}).`,
      },
      { status: 400 },
    );
  }

  const rawIssue = first.rawIssue;
  const currentTitle = readString(rawIssue.title) ?? first.data.title;
  const currentDescription = typeof rawIssue.description === "string" ? rawIssue.description : "";

  const product = gitlabDvituComputeProductFromDvitUScores(scores);
  const baseTitle = gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle(currentTitle);
  const nextTitle = `[DVITU: ${product}] ${baseTitle}`;

  try {
    const axes: { key: "d" | "v" | "i" | "t" | "u"; val: number; expl?: string }[] = [
      { key: "d", val: d, expl: explanationD },
      { key: "v", val: v, expl: explanationV },
      { key: "i", val: i, expl: explanationI },
      { key: "t", val: t, expl: explanationT },
      { key: "u", val: u, expl: explanationU },
    ];
    
    const inserts = axes.map((a) => ({
      id: crypto.randomUUID(),
      issueUrl: parsed.origin + "/" + parsed.projectPath + "/-/issues/" + parsed.iid,
      issueTitle: baseTitle,
      axis: a.key.toUpperCase(),
      score: a.val,
      explanation: a.expl && a.expl.trim() ? a.expl.trim() : null,
      createdAt: new Date(),
    }));

    db.insert(triageHistory).values(inserts).run();
  } catch (err) {
    console.error("Failed to save triage history to SQLite:", err);
  }

  const performedAtIso = new Date().toISOString();
  const scoresForBlock = { d, u, t, v, i } as GitlabDvituScoresForMarkdownBlockV1;
  const append = gitlabDvituBuildMarkdownAppendBlockCollapsedDetailsWithScoreTableV1({
    performedAtIso,
    scores: scoresForBlock,
    explanations: explanations,
  });
  const nextDescription = `${currentDescription}${append}`;

  const appliedLabel = gitlabDvituAppliedLabelNameFromEnv();
  const triageRemoval = gitlabDvituTriageLabelNamesFromEnvCsvForRemoval();
  const putBody = {
    title: nextTitle,
    description: nextDescription,
    add_labels: appliedLabel,
    remove_labels: triageRemoval.join(","),
  };

  const putRaw = await gitlabServerHttpPutJsonWithPrivateTokenAndTlsDevFlag(
    issueApiBase,
    gitlabToken!,
    tlsInsecureDev,
    JSON.stringify(putBody),
  );

  if (!putRaw.ok) {
    return json(
      {
        ok: false,
        code: "gitlab_put_failed",
        message: `Falha ao atualizar a issue: ${putRaw.cause instanceof Error ? putRaw.cause.message : String(putRaw.cause)}`,
      },
      { status: 502 },
    );
  }

  if (putRaw.status === 401 || putRaw.status === 403) {
    return json(
      {
        ok: false,
        code: "gitlab_unauthorized",
        message: "O GitLab recusou o token ao salvar a matriz (401/403). O token precisa poder editar issues.",
      },
      { status: 502 },
    );
  }

  if (putRaw.status < 200 || putRaw.status >= 300) {
    return json(
      {
        ok: false,
        code: "gitlab_put_upstream_error",
        message: `GitLab retornou HTTP ${putRaw.status} ao salvar. ${putRaw.bodyText ? putRaw.bodyText.slice(0, 500) : ""}`.trim(),
      },
      { status: 502 },
    );
  }

  const after = await gitlabRestFetchIssueSummaryDtoWithRawIssueJsonForServer({
    gitlabBaseUrl,
    projectPath: parsed.projectPath,
    iid: parsed.iid,
    token: gitlabToken!,
    tlsInsecureDev,
  });

  if (!after.ok) {
    return json(
      {
        ok: false,
        code: after.code,
        message: `${after.message} (A issue pode ter sido atualizada; use Atualizar no card.)`,
      },
      { status: after.httpStatus },
    );
  }

  return json({ ok: true, data: after.data });
}
