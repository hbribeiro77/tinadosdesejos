import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * GitLab com `with_labels_details=true` devolve objetos ricos em `labels` (name, color, …).
 * Algumas respostas também trazem `label_details`; priorizar só um campo pode descartar `color`.
 * Unimos todas as fontes de objeto e fazemos merge de cor por nome (preferindo valor não-nulo).
 */
function mapLabels(issue: Record<string, unknown>): GitLabIssueSummaryDto["labels"] {
  const labelsField = issue.labels;
  const detailsField = issue.label_details;

  const colorByName = new Map<string, string | null>();

  function ingestLabelObject(raw: Record<string, unknown>) {
    const name = readString(raw.name) ?? readString(raw.title);
    if (!name) return;
    const color = readString(raw.color) ?? readString(raw.background_color);
    const prev = colorByName.get(name);
    if (prev === undefined) {
      colorByName.set(name, color ?? null);
      return;
    }
    if (color && !prev) colorByName.set(name, color);
  }

  if (Array.isArray(detailsField)) {
    for (const raw of detailsField) {
      if (typeof raw === "object" && raw !== null) ingestLabelObject(raw as Record<string, unknown>);
    }
  }
  if (Array.isArray(labelsField)) {
    for (const raw of labelsField) {
      if (typeof raw === "object" && raw !== null) ingestLabelObject(raw as Record<string, unknown>);
    }
  }

  if (!Array.isArray(labelsField) || labelsField.length === 0) {
    if (!Array.isArray(detailsField) || detailsField.length === 0) return [];

    const out: GitLabIssueSummaryDto["labels"] = [];
    const seen = new Set<string>();
    for (const raw of detailsField) {
      if (typeof raw !== "object" || raw === null) continue;
      const name =
        readString((raw as Record<string, unknown>).name) ??
        readString((raw as Record<string, unknown>).title);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({ name, color: colorByName.get(name) ?? null });
    }
    return out;
  }

  if (labelsField.every((x) => typeof x === "string")) {
    return labelsField.map((name) => ({
      name: String(name),
      color: colorByName.get(String(name)) ?? null,
    }));
  }

  const ordered: GitLabIssueSummaryDto["labels"] = [];
  const seen = new Set<string>();
  for (const raw of labelsField) {
    if (typeof raw !== "object" || raw === null) continue;
    const label = raw as Record<string, unknown>;
    const name = readString(label.name) ?? readString(label.title);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    ordered.push({ name, color: colorByName.get(name) ?? null });
  }
  return ordered;
}

function mapAssignees(issue: Record<string, unknown>) {
  const assignees = issue.assignees;
  if (!Array.isArray(assignees)) return [];

  return assignees
    .map((raw) => {
      const a = raw as Record<string, unknown>;
      const username = readString(a.username) ?? "";
      const name = readString(a.name) ?? username;
      if (!username && !name) return null;
      const avatarUrl = readString(a.avatar_url);
      return {
        name: name || username,
        username: username || name,
        avatarUrl,
      };
    })
    .filter(Boolean) as GitLabIssueSummaryDto["assignees"];
}

export function mapGitLabRestIssueJsonToSummaryDto(
  issue: Record<string, unknown>,
  projectPath: string,
): GitLabIssueSummaryDto {
  const gitlabIssueIdRaw = issue.id;
  const gitlabIssueId =
    typeof gitlabIssueIdRaw === "number" && Number.isFinite(gitlabIssueIdRaw)
      ? gitlabIssueIdRaw
      : typeof gitlabIssueIdRaw === "string" && Number.isFinite(Number(gitlabIssueIdRaw))
        ? Number(gitlabIssueIdRaw)
        : undefined;

  const iid = Number(issue.iid);
  const title = readString(issue.title) ?? "(sem título)";
  const state = readString(issue.state) ?? "unknown";
  const webUrl = readString(issue.web_url) ?? "";
  const updatedAt = readString(issue.updated_at) ?? new Date().toISOString();
  const createdAt = readString(issue.created_at) ?? updatedAt;
  const descriptionRaw = issue.description;
  const gitlabDescriptionMarkdown =
    typeof descriptionRaw === "string" && descriptionRaw.trim() ? descriptionRaw : undefined;

  return {
    ...(gitlabIssueId != null ? { gitlabIssueId } : {}),
    iid: Number.isFinite(iid) ? iid : 0,
    title,
    state,
    webUrl,
    projectPath,
    labels: mapLabels(issue),
    assignees: mapAssignees(issue),
    createdAt,
    updatedAt,
    ...(gitlabDescriptionMarkdown ? { gitlabDescriptionMarkdown } : {}),
  };
}
