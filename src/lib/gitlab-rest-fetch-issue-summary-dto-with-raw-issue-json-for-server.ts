import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import {
  gitlabServerHttpGetWithPrivateTokenAndTlsDevFlag,
  normalizeGitlabBaseUrl,
} from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";
import { mapGitLabRestIssueJsonToSummaryDto } from "@/lib/map-gitlab-rest-issue-json-to-summary-dto";
import {
  mergeGitLabIssueSummaryDtoLabelsWithProjectLabelColorLookup,
  wishGitlabRestFetchProjectLabelNameToHexColorMap,
} from "@/lib/wish-gitlab-rest-fetch-project-label-name-to-hex-color-map-for-resolve-enrichment";
import { enrichGitLabIssueSummaryDtoWithMirroredDescriptionUploadAssetsOnServerV1 } from "@/lib/mirror-gitlab-issue-description-upload-assets-to-local-data-directory-and-rewrite-markdown-on-server-v1";

/** Mesmo GET usado em rotas que precisam do JSON bruto da issue (ex.: descrição Markdown completa). */
export async function gitlabRestFetchIssueSummaryDtoWithRawIssueJsonForServer(params: {
  gitlabBaseUrl: string;
  projectPath: string;
  iid: number;
  token: string;
  tlsInsecureDev: boolean;
}): Promise<
  | { ok: true; data: GitLabIssueSummaryDto; rawIssue: Record<string, unknown> }
  | { ok: false; code: string; message: string; httpStatus: number }
> {
  const { gitlabBaseUrl, projectPath, iid, token, tlsInsecureDev } = params;
  const base = normalizeGitlabBaseUrl(gitlabBaseUrl);
  const projectEnc = encodeURIComponent(projectPath);
  const apiUrl = `${base}/api/v4/projects/${projectEnc}/issues/${iid}?with_labels_details=true`;

  const raw = await gitlabServerHttpGetWithPrivateTokenAndTlsDevFlag(apiUrl, token, tlsInsecureDev);
  if (!raw.ok) {
    return {
      ok: false,
      code: "gitlab_fetch_failed",
      message: `Falha ao chamar o GitLab: ${raw.cause instanceof Error ? raw.cause.message : String(raw.cause)}`,
      httpStatus: 502,
    };
  }

  const upstreamStatus = raw.status;
  const bodyText = raw.bodyText;

  if (upstreamStatus === 401 || upstreamStatus === 403) {
    return {
      ok: false,
      code: "gitlab_unauthorized",
      message: "O GitLab recusou o token (401/403). Verifique escopos/permissões do token.",
      httpStatus: 502,
    };
  }

  if (upstreamStatus === 404) {
    return {
      ok: false,
      code: "gitlab_not_found",
      message: "Issue não encontrada (404). Confira projeto/IID e permissões.",
      httpStatus: 404,
    };
  }

  if (upstreamStatus < 200 || upstreamStatus >= 300) {
    return {
      ok: false,
      code: "gitlab_upstream_error",
      message: `GitLab retornou HTTP ${upstreamStatus}. ${bodyText ? bodyText.slice(0, 500) : ""}`.trim(),
      httpStatus: 502,
    };
  }

  let jsonBody: Record<string, unknown>;
  try {
    jsonBody = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return {
      ok: false,
      code: "gitlab_upstream_error",
      message: "GitLab retornou resposta que não é JSON válido.",
      httpStatus: 502,
    };
  }

  let data = mapGitLabRestIssueJsonToSummaryDto(jsonBody, projectPath);

  if (data.labels.some((l) => !l.color)) {
    const colorByName = await wishGitlabRestFetchProjectLabelNameToHexColorMap({
      gitlabBaseUrl,
      projectPath,
      token,
      tlsInsecureDev,
    });
    data = mergeGitLabIssueSummaryDtoLabelsWithProjectLabelColorLookup(data, colorByName);
  }

  data = await enrichGitLabIssueSummaryDtoWithMirroredDescriptionUploadAssetsOnServerV1(data, {
    gitlabBaseUrl,
    token,
    tlsInsecureDev,
    skipMirror: process.env.GITLAB_MOCK === "1",
  });

  return { ok: true, data, rawIssue: jsonBody };
}
