const PREFIX = "smarttask:";

/** URL sintética guardada em `WishKanbanCard.issueUrl` para cards vindos do SmartTask. */
export function smartTaskKanbanIssueUrlFromTaskId(taskId: string): string {
  return `${PREFIX}${encodeURIComponent(taskId)}`;
}

export function isSmartTaskKanbanIssueUrl(raw: string): boolean {
  return typeof raw === "string" && raw.trim().toLowerCase().startsWith(PREFIX);
}

export function parseSmartTaskIdFromKanbanIssueUrl(raw: string): string | null {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t.toLowerCase().startsWith(PREFIX)) return null;
  try {
    return decodeURIComponent(t.slice(PREFIX.length));
  } catch {
    return null;
  }
}
