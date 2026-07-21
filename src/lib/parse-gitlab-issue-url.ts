export type ParsedGitLabIssueUrl = {
  origin: string;
  hostname: string;
  projectPath: string;
  iid: number;
};

export class GitLabIssueUrlParseError extends Error {
  readonly code:
    | "invalid_url"
    | "not_http_url"
    | "missing_issue_path"
    | "invalid_iid";

  constructor(
    code: GitLabIssueUrlParseError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "GitLabIssueUrlParseError";
    this.code = code;
  }
}

export function parseGitLabIssueUrl(raw: string): ParsedGitLabIssueUrl {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new GitLabIssueUrlParseError("invalid_url", "URL vazia.");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch (cause) {
    throw new GitLabIssueUrlParseError("invalid_url", "Não foi possível interpretar a URL.", {
      cause,
    });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new GitLabIssueUrlParseError("not_http_url", "A URL precisa ser http(s).");
  }

  const pathname = url.pathname.replace(/\/+$/, "");
  const match = pathname.match(/^\/(.+)\/-\/(?:issues|work_items)\/(\d+)$/);
  if (!match) {
    throw new GitLabIssueUrlParseError(
      "missing_issue_path",
      "Esperado um caminho no formato `.../-/issues/:iid` ou `.../-/work_items/:iid` (link web do GitLab).",
    );
  }

  const projectPath = match[1];
  const iid = Number.parseInt(match[2]!, 10);
  if (!Number.isFinite(iid) || iid <= 0) {
    throw new GitLabIssueUrlParseError("invalid_iid", "IID da issue inválido.");
  }

  return {
    origin: url.origin,
    hostname: url.hostname,
    projectPath: decodeURIComponent(projectPath),
    iid,
  };
}
