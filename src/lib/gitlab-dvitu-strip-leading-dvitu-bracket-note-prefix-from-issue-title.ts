const GITLAB_DVITU_TITLE_PREFIX_RE = /^\[DVITU:\s*\d+\]\s*/i;

/** Remove `[DVITU: <número>]` do início do título (para reaplicar nota sem duplicar). */
export function gitlabDvituStripLeadingDvituBracketNotePrefixFromIssueTitle(title: string): string {
  return title.replace(GITLAB_DVITU_TITLE_PREFIX_RE, "").trim();
}
