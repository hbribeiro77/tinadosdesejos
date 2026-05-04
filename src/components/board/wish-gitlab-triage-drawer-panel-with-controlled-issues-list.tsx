"use client";

import { useEffect, useMemo, useState } from "react";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import { clientFetchGitLabTriageGroupIssuesPage } from "@/lib/client-fetch-gitlab-triage-group-issues-api";
import { clientFetchGitlabTriageImportDefaults } from "@/lib/client-fetch-gitlab-triage-import-defaults-api";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";
import { WishSmartTaskTriageImportSectionPanelInDrawerClient } from "@/components/board/wish-smart-task-triage-import-section-panel-in-drawer-client";
import { smartTaskKanbanIssueUrlFromTaskId } from "@/lib/smart-task-kanban-issue-url-build-and-parse-task-id";
import { normalizeCommaSeparatedGitlabImportLabelsCsv } from "@/lib/parse-gitlab-import-labels-csv-from-triage-group-list-request-body";
import {
  readWishGitlabDrawerImportLabelsCsvFromLocalStorage,
  writeWishGitlabDrawerImportLabelsCsvToLocalStorage,
} from "@/lib/wish-gitlab-drawer-import-labels-csv-local-storage-read-write";
import { WishGitlabTriageIssueDraggableRowFromDrawer } from "@/components/board/wish-gitlab-triage-issue-draggable-row-from-drawer";
import { gitlabIssueUrlCanonicalKeyForBoardMatch } from "@/lib/gitlab-issue-url-canonical-key-for-board-match";

type WishGitlabTriageDrawerPanelWithControlledIssuesListProps = {
  open: boolean;
  onClose: () => void;
  board: WishKanbanBoard;
  issues: GitLabIssueSummaryDto[];
  setIssues: React.Dispatch<React.SetStateAction<GitLabIssueSummaryDto[]>>;
  smartTaskTasks: SmartTaskNormalizedTask[];
  setSmartTaskTasks: React.Dispatch<React.SetStateAction<SmartTaskNormalizedTask[]>>;
};

function collectBoardGitlabIssueIdentityKeys(board: WishKanbanBoard) {
  const keys = new Set<string>();
  for (const c of Object.values(board.cardsById)) {
    const k = gitlabIssueUrlCanonicalKeyForBoardMatch(c.issueUrl);
    if (k) keys.add(k);
  }
  return keys;
}

export function WishGitlabTriageDrawerPanelWithControlledIssuesList(
  props: WishGitlabTriageDrawerPanelWithControlledIssuesListProps,
) {
  const { open, onClose, board, issues, setIssues, smartTaskTasks, setSmartTaskTasks } = props;
  const [triageSource, setTriageSource] = useState<"gitlab" | "smarttask">("gitlab");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(null);
  /** CSV de labels (AND no GitLab); default alinhado ao servidor + `GITLAB_TRIAGE_LABEL`. */
  const [importLabelsCsv, setImportLabelsCsv] = useState("Triagem de issues");
  const [groupPathHint, setGroupPathHint] = useState<string | null>(null);

  const boardIssueIdentityKeys = useMemo(() => collectBoardGitlabIssueIdentityKeys(board), [board]);
  const visibleSmartTaskCount = useMemo(() => {
    const onBoard = new Set(Object.values(board.cardsById).map((c) => c.issueUrl.trim()));
    return smartTaskTasks.filter((t) => !onBoard.has(smartTaskKanbanIssueUrlFromTaskId(t.id))).length;
  }, [board.cardsById, smartTaskTasks]);

  useEffect(() => {
    if (!open) return;
    setIssues((prev) =>
      prev.filter((i) => {
        const k = gitlabIssueUrlCanonicalKeyForBoardMatch(i.webUrl);
        return !k || !boardIssueIdentityKeys.has(k);
      }),
    );
  }, [boardIssueIdentityKeys, open, setIssues]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const stored = readWishGitlabDrawerImportLabelsCsvFromLocalStorage();
      const defs = await clientFetchGitlabTriageImportDefaults();
      if (cancelled) return;
      if (defs?.groupPathDisplay) setGroupPathHint(defs.groupPathDisplay);
      if (stored !== null) {
        setImportLabelsCsv(stored);
        return;
      }
      if (defs?.defaultImportLabelsCsv) setImportLabelsCsv(defs.defaultImportLabelsCsv);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (visibleSmartTaskCount > 0) {
      setTriageSource("smarttask");
    }
  }, [open, visibleSmartTaskCount]);

  async function fetchPage(page: number, mode: "replace" | "append") {
    setLoading(true);
    setError(null);
    try {
      const normalized = normalizeCommaSeparatedGitlabImportLabelsCsv(importLabelsCsv);
      writeWishGitlabDrawerImportLabelsCsvToLocalStorage(importLabelsCsv);
      const res = await clientFetchGitLabTriageGroupIssuesPage({
        page,
        perPage: 30,
        labelsCsv: normalized || undefined,
      });
      if (!res.ok) {
        setError(res.message);
        if (mode === "replace") setIssues([]);
        setNextPage(null);
        return;
      }

      const filtered = res.issues.filter((i) => {
        const k = gitlabIssueUrlCanonicalKeyForBoardMatch(i.webUrl);
        return !k || !boardIssueIdentityKeys.has(k);
      });

      setIssues((prev) => {
        if (mode === "replace") return filtered;
        const existing = new Set(
          prev
            .map((i) => gitlabIssueUrlCanonicalKeyForBoardMatch(i.webUrl))
            .filter((k): k is string => k !== null),
        );
        const appended = filtered.filter((i) => {
          const k = gitlabIssueUrlCanonicalKeyForBoardMatch(i.webUrl);
          return k && !existing.has(k);
        });
        return [...prev, ...appended];
      });

      setNextPage(res.nextPage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao buscar triagem.");
      if (mode === "replace") setIssues([]);
      setNextPage(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      id="wish-gitlab-triage-drawer-panel"
      aria-label="Triagem de issues GitLab"
      aria-hidden={!open}
      className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden"
    >
      <div
        className={[
          "flex h-full min-h-0 w-full min-w-0 flex-col bg-gradient-to-b from-violet-50 via-violet-50/95 to-fuchsia-50/80 text-zinc-900 dark:from-violet-950/90 dark:via-violet-950/85 dark:to-fuchsia-950/40 dark:text-zinc-100",
          !open ? "pointer-events-none" : "",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3 border-b border-violet-200/70 p-4 dark:border-violet-800/50">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-violet-950 dark:text-violet-100">
              <span>Triagem</span>
              <span className="rounded-full border border-violet-300/70 bg-white/80 px-2 py-0.5 text-xs font-semibold text-violet-900 dark:border-violet-700/60 dark:bg-violet-900/50 dark:text-violet-100">
                GitLab: {issues.length}
              </span>
              <span className="rounded-full border border-teal-300/70 bg-white/80 px-2 py-0.5 text-xs font-semibold text-teal-900 dark:border-teal-700/60 dark:bg-teal-900/40 dark:text-teal-100">
                SmartTask: {visibleSmartTaskCount}
              </span>
            </div>
            <div className="mt-1 text-xs text-violet-900/75 dark:text-violet-200/80">
              Alterne entre as fontes da gaveta para manter foco: issues do GitLab ou tarefas vindas do SmartTask.
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1 text-sm text-violet-900 hover:bg-violet-200/50 dark:text-violet-100 dark:hover:bg-violet-900/60"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <div className="border-b border-violet-200/70 px-4 py-2 dark:border-violet-800/50">
          <div className="inline-flex rounded-lg border border-violet-300/70 bg-white/80 p-1 text-xs dark:border-violet-700/60 dark:bg-violet-900/40">
            <button
              type="button"
              className={[
                "rounded-md px-3 py-1.5 font-semibold transition-colors",
                triageSource === "gitlab"
                  ? "bg-violet-700 text-white shadow-sm dark:bg-violet-500 dark:text-violet-950"
                  : "text-violet-900 hover:bg-violet-100/80 dark:text-violet-100 dark:hover:bg-violet-800/50",
              ].join(" ")}
              onClick={() => setTriageSource("gitlab")}
            >
              GitLab ({issues.length})
            </button>
            <button
              type="button"
              className={[
                "rounded-md px-3 py-1.5 font-semibold transition-colors",
                triageSource === "smarttask"
                  ? "bg-teal-700 text-white shadow-sm dark:bg-teal-500 dark:text-teal-950"
                  : "text-teal-900 hover:bg-teal-100/70 dark:text-teal-100 dark:hover:bg-teal-800/50",
              ].join(" ")}
              onClick={() => setTriageSource("smarttask")}
            >
              SmartTask ({visibleSmartTaskCount})
            </button>
          </div>
        </div>

        {triageSource === "gitlab" ? (
          <>
            <div className="border-b border-violet-200/70 px-4 pb-3 pt-2 dark:border-violet-800/50">
              <label className="block text-xs font-medium text-violet-950 dark:text-violet-100" htmlFor="wish-gitlab-import-labels-csv">
                Labels para importar (separadas por vírgula)
              </label>
              <textarea
                id="wish-gitlab-import-labels-csv"
                rows={2}
                className="mt-1.5 w-full resize-y rounded-md border border-violet-300/80 bg-white/90 px-2.5 py-2 text-sm text-violet-950 shadow-sm placeholder:text-violet-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-violet-700/60 dark:bg-violet-950/50 dark:text-violet-50 dark:placeholder:text-violet-500"
                value={importLabelsCsv}
                onChange={(e) => setImportLabelsCsv(e.target.value)}
                onBlur={() => writeWishGitlabDrawerImportLabelsCsvToLocalStorage(importLabelsCsv)}
                placeholder="Triagem de issues, outra-label"
                spellCheck={false}
              />
              <div className="mt-2 text-xs text-violet-900/70 dark:text-violet-200/75">
                Grupo alvo: <span className="font-medium">{groupPathHint ?? "…"}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-violet-200/70 p-4 dark:border-violet-800/50">
              <button
                type="button"
                className="rounded-md bg-violet-700 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-800 disabled:opacity-50 dark:bg-violet-500 dark:text-violet-950 dark:hover:bg-violet-400"
                disabled={loading}
                onClick={() => void fetchPage(1, "replace")}
              >
                {loading ? "Buscando..." : "Atualizar lista"}
              </button>

              {nextPage ? (
                <button
                  type="button"
                  className="rounded-md border border-violet-300/80 bg-white/90 px-3 py-2 text-sm font-medium text-violet-950 hover:bg-violet-100/80 disabled:opacity-50 dark:border-violet-700/60 dark:bg-violet-900/40 dark:text-violet-50 dark:hover:bg-violet-900/70"
                  disabled={loading}
                  onClick={() => void fetchPage(nextPage, "append")}
                >
                  Carregar mais
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {issues.length === 0 ? (
                <div className="rounded-lg border border-dashed border-violet-300/70 bg-white/50 p-4 text-sm text-violet-900/80 dark:border-violet-700/50 dark:bg-violet-950/30 dark:text-violet-200/80">
                  Nenhuma issue na gaveta. Clique em <span className="font-medium">Atualizar lista</span> para buscar no
                  GitLab. Issues que já estão no quadro não aparecem aqui.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {issues.map((issue) => (
                    <WishGitlabTriageIssueDraggableRowFromDrawer
                      key={gitlabIssueUrlCanonicalKeyForBoardMatch(issue.webUrl) ?? issue.webUrl}
                      preview={issue}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <WishSmartTaskTriageImportSectionPanelInDrawerClient
            board={board}
            smartTaskTasks={smartTaskTasks}
            setSmartTaskTasks={setSmartTaskTasks}
          />
        )}

        <div className="border-t border-violet-200/70 p-3 text-center text-xs text-violet-800/70 dark:border-violet-800/50 dark:text-violet-300/70">
          {triageSource === "gitlab"
            ? "Arraste uma issue do GitLab para uma coluna do quadro."
            : "Arraste uma tarefa SmartTask para uma coluna do quadro."}
        </div>
      </div>
    </aside>
  );
}
