const GITLAB_GUT_TITLE_PREFIX_RE = /^\[GUT:\s*\d+\]\s*/i;

export function gitlabGutStripLeadingGutBracketNotePrefixFromIssueTitle(title: string): string {
  return title.replace(GITLAB_GUT_TITLE_PREFIX_RE, "").trim();
}
