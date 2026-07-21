import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { triageHistory } from "@/db/schema";
import { gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle } from "@/lib/gitlab-dvitu-strip-leading-dvitu-bracket-note-prefix-from-issue-title";
import { gitlabRestFetchIssueSummaryDtoWithRawIssueJsonForServer } from "@/lib/gitlab-rest-fetch-issue-summary-dto-with-raw-issue-json-for-server";
import { normalizeGitlabBaseUrl } from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";
import { parseGitlabIssueMarkdownDescriptionExtractDvituMatrixScoresForTriageHistoryImportV1 } from "@/lib/parse-gitlab-issue-markdown-description-extract-dvitu-matrix-scores-for-triage-history-import-v1";
import { GitLabIssueUrlParseError, parseGitLabIssueUrl } from "@/lib/parse-gitlab-issue-url";
import crypto from "crypto";
import type {
  TriageHistoryImportDvituFromGitlabIssueUrlsResponseDto,
  TriageHistoryImportDvituFromGitlabIssueUrlsResultItemDto,
} from "@/lib/triage-history-import-dvitu-from-gitlab-issue-urls-api-response-dto-types";
import { wishViewOnlyModeRejectIfEnabledAsNextResponseV1 } from "@/lib/wish-view-only-mode-json-error-response-v1";

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

const bodySchema = z.object({
  issueUrls: z.array(z.string().min(1)).min(1).max(80),
});

function json(body: TriageHistoryImportDvituFromGitlabIssueUrlsResponseDto, status?: number) {
  return NextResponse.json(body, { status: status ?? (body.ok ? 200 : 400) });
}

export async function POST(request: Request) {
  const viewOnlyRejected = wishViewOnlyModeRejectIfEnabledAsNextResponseV1();
  if (viewOnlyRejected) return viewOnlyRejected;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return json({ ok: false, code: "invalid_json", message: "Body JSON inválido." }, 400);
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        code: "invalid_body",
        message: parsed.error.issues.map((i) => i.message).join("; ") || "Body inválido.",
      },
      400,
    );
  }

  const mockEnabled = process.env.GITLAB_MOCK === "1";
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
      503,
    );
  }

  if (!gitlabBaseUrl) {
    return json({ ok: false, code: "gitlab_not_configured", message: "Defina `GITLAB_BASE_URL` no servidor." }, 503);
  }

  const tlsInsecureDev = process.env.GITLAB_TLS_INSECURE_DEV === "1";
  const baseNorm = normalizeGitlabBaseUrl(gitlabBaseUrl);

  const results: TriageHistoryImportDvituFromGitlabIssueUrlsResultItemDto[] = [];

  for (const rawUrl of parsed.data.issueUrls) {
    const issueUrl = rawUrl.trim();
    if (!issueUrl) continue;

    let parsedUrl;
    try {
      parsedUrl = parseGitLabIssueUrl(issueUrl);
    } catch (cause) {
      results.push({
        issueUrl,
        ok: false,
        message: cause instanceof GitLabIssueUrlParseError ? cause.message : "URL inválida.",
      });
      continue;
    }

    const issueOriginUrl = new URL(parsedUrl.origin);
    const baseUrlForCompare = new URL(baseNorm);
    if (issueOriginUrl.origin !== baseUrlForCompare.origin) {
      results.push({
        issueUrl,
        ok: false,
        message:
          "O host da URL não bate com `GITLAB_BASE_URL`. Isso bloqueia uso acidental de links externos.",
      });
      continue;
    }

    if (mockEnabled) {
      results.push({
        issueUrl,
        ok: false,
        message:
          "Importação do histórico DVITU não está disponível com `GITLAB_MOCK=1` (sem descrição real da issue). Desligue o mock ou use um ambiente com GitLab.",
      });
      continue;
    }

    const canonicalIssueUrl = `${parsedUrl.origin}/${parsedUrl.projectPath}/-/issues/${parsedUrl.iid}`;

    const fetched = await gitlabRestFetchIssueSummaryDtoWithRawIssueJsonForServer({
      gitlabBaseUrl,
      projectPath: parsedUrl.projectPath,
      iid: parsedUrl.iid,
      token: gitlabToken!,
      tlsInsecureDev,
    });

    if (!fetched.ok) {
      results.push({ issueUrl, ok: false, message: fetched.message });
      continue;
    }

    const description = readString(fetched.rawIssue.description);
    if (!description) {
      results.push({
        issueUrl,
        ok: false,
        message: "A issue não tem descrição no GitLab (não há onde ler a matriz DVITU).",
      });
      continue;
    }

    const matrix = parseGitlabIssueMarkdownDescriptionExtractDvituMatrixScoresForTriageHistoryImportV1(description);
    if (!matrix.ok) {
      results.push({ issueUrl, ok: false, message: matrix.message });
      continue;
    }

    const baseTitle = gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle(fetched.data.title);

    const axes: { key: "d" | "v" | "i" | "t" | "u"; val: number; expl?: string }[] = [
      { key: "d", val: matrix.scores.d, expl: matrix.explanations.d },
      { key: "v", val: matrix.scores.v, expl: matrix.explanations.v },
      { key: "i", val: matrix.scores.i, expl: matrix.explanations.i },
      { key: "t", val: matrix.scores.t, expl: matrix.explanations.t },
      { key: "u", val: matrix.scores.u, expl: matrix.explanations.u },
    ];

    const createdAt = matrix.performedAt ?? new Date();

    try {
      db.delete(triageHistory).where(eq(triageHistory.issueUrl, canonicalIssueUrl)).run();

      const inserts = axes.map((a) => ({
        id: crypto.randomUUID(),
        issueUrl: canonicalIssueUrl,
        issueTitle: baseTitle,
        axis: a.key.toUpperCase(),
        score: a.val,
        explanation: a.expl && a.expl.trim() ? a.expl.trim() : null,
        createdAt,
      }));

      db.insert(triageHistory).values(inserts).run();
    } catch (err) {
      console.error("SQLite triage history import failed:", err);
      results.push({
        issueUrl,
        ok: false,
        message: err instanceof Error ? err.message : "Falha ao gravar no SQLite.",
      });
      continue;
    }

    results.push({
      issueUrl,
      ok: true,
      insertedRows: axes.length,
      hint: matrix.productMismatchHint,
    });
  }

  return json({ ok: true, data: results });
}
