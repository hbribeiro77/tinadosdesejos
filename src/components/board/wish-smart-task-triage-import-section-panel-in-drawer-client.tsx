"use client";

import { useMemo } from "react";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";
import { smartTaskKanbanIssueUrlFromTaskId } from "@/lib/smart-task-kanban-issue-url-build-and-parse-task-id";
import { smartTaskNormalizedTaskMapToGitLabIssueSummaryDtoForKanbanPreview } from "@/lib/smart-task-task-map-normalized-to-gitlab-issue-summary-dto-for-kanban-preview";
import { WishSmartTaskTriageDraggableRowFromDrawer } from "@/components/board/wish-smart-task-triage-draggable-row-from-drawer";

type WishSmartTaskTriageImportSectionPanelInDrawerClientProps = {
  board: WishKanbanBoard;
  smartTaskTasks: SmartTaskNormalizedTask[];
  setSmartTaskTasks: React.Dispatch<React.SetStateAction<SmartTaskNormalizedTask[]>>;
};

export function WishSmartTaskTriageImportSectionPanelInDrawerClient(
  props: WishSmartTaskTriageImportSectionPanelInDrawerClientProps,
) {
  const { board, smartTaskTasks, setSmartTaskTasks } = props;

  const visibleTasks = useMemo(() => {
    const onBoard = new Set(
      Object.values(board.cardsById).map((c) => c.issueUrl.trim()),
    );
    return smartTaskTasks.filter((t) => !onBoard.has(smartTaskKanbanIssueUrlFromTaskId(t.id)));
  }, [board.cardsById, smartTaskTasks]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-violet-200/70 px-4 py-3 dark:border-violet-800/50">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-violet-950 dark:text-violet-100">
          <span>SmartTask</span>
          <span className="rounded-full border border-teal-400/60 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-950 dark:border-teal-600/50 dark:bg-teal-950/40 dark:text-teal-100">
            {visibleTasks.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-violet-900/75 dark:text-violet-200/80">
          Tarefas recebidas via integração direta do SmartTask. Itens já presentes no quadro não aparecem aqui.
        </p>
      </div>

      <div className="px-4 py-3">
        <button
          type="button"
          className="rounded-md border border-red-300/80 bg-white/90 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-900/40"
          disabled={smartTaskTasks.length === 0}
          onClick={() => setSmartTaskTasks([])}
          title="Remove todas as tasks SmartTask carregadas nesta gaveta"
        >
          Limpar SmartTask
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {visibleTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-teal-300/60 bg-white/40 p-3 text-xs text-teal-950/80 dark:border-teal-700/45 dark:bg-teal-950/20 dark:text-teal-100/80">
            Nenhuma tarefa SmartTask disponível no momento. Compartilhe uma tarefa pelo SmartTask para ela aparecer aqui.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleTasks.map((t) => {
              const preview = smartTaskNormalizedTaskMapToGitLabIssueSummaryDtoForKanbanPreview(t);
              return (
                <WishSmartTaskTriageDraggableRowFromDrawer key={t.id} taskId={t.id} preview={preview} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
