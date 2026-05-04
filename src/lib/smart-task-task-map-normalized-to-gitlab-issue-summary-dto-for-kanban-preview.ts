import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";
import { smartTaskKanbanIssueUrlFromTaskId } from "@/lib/smart-task-kanban-issue-url-build-and-parse-task-id";

function stablePositiveIidFromTaskId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  const positive = Math.abs(h);
  return (positive % 899_999_999) + 1;
}

const PRIORITY_LABEL: Record<SmartTaskNormalizedTask["priority"], string> = {
  1: "SmartTask • P1",
  2: "SmartTask • P2",
  3: "SmartTask • P3",
  4: "SmartTask • P4",
};

/**
 * Preview compatível com cards GitLab no quadro; `webUrl` é sintético (`smarttask:…`).
 * Descrição Markdown fica em `smartTaskDescriptionMarkdown` para busca e futura UI.
 */
export function smartTaskNormalizedTaskMapToGitLabIssueSummaryDtoForKanbanPreview(
  task: SmartTaskNormalizedTask,
): GitLabIssueSummaryDto {
  const labels = [
    { name: PRIORITY_LABEL[task.priority], color: "#6366f1" },
    ...task.tags.map((name) => ({ name, color: "#64748b" as string | null })),
  ];
  if (task.focusOfDay) {
    labels.push({ name: "Foco do dia", color: "#f59e0b" });
  }

  const subtaskLine = task.subtasks.map((s) => s.title).join(" ");
  const smartTaskSearchHaystack = [task.description, subtaskLine, task.dueDate ?? "", task.archivedAt ?? ""]
    .filter(Boolean)
    .join("\n");

  return {
    iid: stablePositiveIidFromTaskId(task.id),
    title: task.title,
    state: task.status,
    webUrl: smartTaskKanbanIssueUrlFromTaskId(task.id),
    projectPath: "SmartTask",
    labels,
    assignees: [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    smartTaskDescriptionMarkdown: task.description,
    smartTaskSearchHaystack,
  };
}
