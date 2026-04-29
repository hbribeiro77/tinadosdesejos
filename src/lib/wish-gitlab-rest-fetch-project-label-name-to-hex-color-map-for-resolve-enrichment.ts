import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import {
  gitlabServerHttpGetWithPrivateTokenAndTlsDevFlag,
  normalizeGitlabBaseUrl,
} from "@/lib/gitlab-server-http-get-with-private-token-and-tls-dev-flag";

/**
 * Lista todas as labels do projeto via REST e monta nome → cor hex (como no GitLab).
 * Usa `include_ancestor_groups=true` quando suportado, para cores de labels herdadas do grupo.
 */
export async function wishGitlabRestFetchProjectLabelNameToHexColorMap(params: {
  gitlabBaseUrl: string;
  projectPath: string;
  token: string;
  tlsInsecureDev: boolean;
}): Promise<Map<string, string>> {
  const base = normalizeGitlabBaseUrl(params.gitlabBaseUrl);
  const projectEnc = encodeURIComponent(params.projectPath);

  async function fetchAll(includeAncestorGroups: boolean): Promise<Map<string, string> | "retry_without_ancestors"> {
    const map = new Map<string, string>();
    const perPage = 100;

    for (let page = 1; page <= 50; page++) {
      const qs = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (includeAncestorGroups) qs.set("include_ancestor_groups", "true");

      const apiUrl = `${base}/api/v4/projects/${projectEnc}/labels?${qs}`;
      const raw = await gitlabServerHttpGetWithPrivateTokenAndTlsDevFlag(apiUrl, params.token, params.tlsInsecureDev);
      if (!raw.ok) break;

      if (raw.status === 400 && includeAncestorGroups) {
        return "retry_without_ancestors";
      }
      if (raw.status < 200 || raw.status >= 300) break;

      let arr: unknown;
      try {
        arr = JSON.parse(raw.bodyText);
      } catch {
        break;
      }
      if (!Array.isArray(arr) || arr.length === 0) break;

      for (const item of arr) {
        if (typeof item !== "object" || item === null) continue;
        const o = item as Record<string, unknown>;
        const name = typeof o.name === "string" ? o.name.trim() : "";
        const color = typeof o.color === "string" ? o.color.trim() : "";
        if (name && color) map.set(name, color);
      }

      if (arr.length < perPage) break;
    }

    return map;
  }

  const first = await fetchAll(true);
  if (first === "retry_without_ancestors") {
    const second = await fetchAll(false);
    return second === "retry_without_ancestors" ? new Map() : second;
  }
  return first;
}

/** Preenche `color` ausente usando o catálogo de labels do projeto (mesmas cores da UI da triagem). */
export function mergeGitLabIssueSummaryDtoLabelsWithProjectLabelColorLookup(
  dto: GitLabIssueSummaryDto,
  colorByLabelName: Map<string, string>,
): GitLabIssueSummaryDto {
  if (colorByLabelName.size === 0) return dto;
  return {
    ...dto,
    labels: dto.labels.map((l) => ({
      ...l,
      color: l.color ?? colorByLabelName.get(l.name) ?? null,
    })),
  };
}
