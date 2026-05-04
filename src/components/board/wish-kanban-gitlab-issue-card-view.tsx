"use client";

import { useEffect, useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WishBoardModalGitlabIssueDvituMatrixScoringFormClient } from "@/components/board/wish-board-modal-gitlab-issue-dvitu-matrix-scoring-form-client";
import { WishBoardModalGitlabIssueGutMatrixScoringFormClient } from "@/components/board/wish-board-modal-gitlab-issue-gut-matrix-scoring-form-client";
import { WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariants } from "@/components/board/wish-gitlab-issue-created-at-metadata-display-badge-span-with-sky-violet-teal-tone-variants";
import { WishGitlabIssueSummaryLabelColoredBadgeSpan } from "@/components/board/wish-gitlab-issue-summary-label-colored-badge-span";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import type { WishKanbanCard } from "@/lib/wish-kanban-board-domain-types";
import { isSmartTaskKanbanIssueUrl } from "@/lib/smart-task-kanban-issue-url-build-and-parse-task-id";
import { wishGitlabDvituFetchRequiredIssueLabelNamesForCardEligibilityCachedOnce } from "@/lib/wish-gitlab-dvitu-fetch-required-issue-label-names-for-card-eligibility-cached-once";
import { wishGitlabGutFetchRequiredIssueLabelNamesForCardEligibilityCachedOnce } from "@/lib/wish-gitlab-gut-fetch-required-issue-label-names-for-card-eligibility-cached-once";
import { wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive } from "@/lib/wish-gitlab-issue-label-names-from-snapshot-match-all-required-names-case-insensitive";

type WishKanbanGitlabIssueCardViewProps = {
  card: WishKanbanCard;
  onRemove: (cardId: string) => void;
  onRefresh: (cardId: string) => Promise<void>;
  onMergeGitlabSnapshotAfterDvitu?: (cardId: string, data: GitLabIssueSummaryDto) => void;
  onMergeGitlabSnapshotAfterGut?: (cardId: string, data: GitLabIssueSummaryDto) => void;
  /** Esmaece o card quando não bate com a busca do quadro (continua no sortable). */
  mutedByBoardSearch?: boolean;
};

export function WishKanbanGitlabIssueCardView(props: WishKanbanGitlabIssueCardViewProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.card.id,
  });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  const [refreshing, setRefreshing] = useState(false);
  const [dvituModalOpen, setDvituModalOpen] = useState(false);
  const [gutModalOpen, setGutModalOpen] = useState(false);
  const [dvituRequiredLabels, setDvituRequiredLabels] = useState<string[] | null>(null);
  const [gutRequiredLabels, setGutRequiredLabels] = useState<string[] | null>(null);
  const snapshot = props.card.snapshot?.data;
  const mutedBySearch = Boolean(props.mutedByBoardSearch);
  const isSmartTaskCard = Boolean(snapshot?.webUrl && isSmartTaskKanbanIssueUrl(snapshot.webUrl));

  useEffect(() => {
    void wishGitlabDvituFetchRequiredIssueLabelNamesForCardEligibilityCachedOnce().then(setDvituRequiredLabels);
    void wishGitlabGutFetchRequiredIssueLabelNamesForCardEligibilityCachedOnce().then(setGutRequiredLabels);
  }, []);

  const showDvituPlay = useMemo(() => {
    if (!snapshot?.labels?.length || isSmartTaskCard || !dvituRequiredLabels?.length) return false;
    const names = snapshot.labels.map((l) => l.name);
    return wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive(names, dvituRequiredLabels);
  }, [snapshot, isSmartTaskCard, dvituRequiredLabels]);

  const showGutPlay = useMemo(() => {
    if (!snapshot?.labels?.length || isSmartTaskCard || !gutRequiredLabels?.length) return false;
    const names = snapshot.labels.map((l) => l.name);
    return wishGitlabIssueLabelNamesFromSnapshotMatchAllRequiredNamesCaseInsensitive(names, gutRequiredLabels);
  }, [snapshot, isSmartTaskCard, gutRequiredLabels]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      aria-hidden={mutedBySearch || undefined}
      className={[
        "rounded-lg border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-950",
        isDragging
          ? "border-dashed border-sky-500/50 bg-sky-50/80 opacity-40 ring-2 ring-sky-400/35 dark:border-sky-400/45 dark:bg-sky-950/35 dark:ring-sky-500/25"
          : "",
        mutedBySearch && !isDragging
          ? "pointer-events-none opacity-[0.22] saturate-0"
          : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className={[
            "flex-1 text-left",
            mutedBySearch ? "cursor-default" : "cursor-grab active:cursor-grabbing",
          ].join(" ")}
          {...attributes}
          {...listeners}
        >
          <div className="text-sm font-bold leading-snug text-zinc-900 dark:text-zinc-100">
            {snapshot?.title ?? "Carregando issue..."}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            {snapshot ? (
              <>
                <span className="font-medium text-zinc-600 dark:text-zinc-300">{snapshot.projectPath}</span>
                <span className="opacity-80">#{snapshot.iid}</span>
                <span className="opacity-50">•</span>
                <span>{snapshot.state}</span>
                {!isSmartTaskKanbanIssueUrl(snapshot.webUrl) && snapshot.createdAt ? (
                  <WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariants
                    iso8601={snapshot.createdAt}
                    tone="sky"
                    title="Data de criação no GitLab (created_at)"
                  />
                ) : null}
              </>
            ) : (
              <span className="break-all">{props.card.issueUrl}</span>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center">
          {showDvituPlay && props.onMergeGitlabSnapshotAfterDvitu && snapshot?.webUrl ? (
            <button
              type="button"
              className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
              title="Matriz DVITU — priorização"
              onClickCapture={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDvituModalOpen(true);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          ) : null}
          {showGutPlay && props.onMergeGitlabSnapshotAfterGut && snapshot?.webUrl ? (
            <button
              type="button"
              className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/35 dark:hover:text-amber-300"
              title="Matriz GUT — priorização"
              onClickCapture={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setGutModalOpen(true);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-black/5 hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-300"
            disabled={refreshing || isSmartTaskCard}
            title={isSmartTaskCard ? "Card SmartTask (sem atualização GitLab)" : "Atualizar dados da issue"}
            onClickCapture={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setRefreshing(true);
              try {
                await props.onRefresh(props.card.id);
              } finally {
                setRefreshing(false);
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            title="Remover card"
            onClick={() => props.onRemove(props.card.id)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      {props.card.lastError ? (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">{props.card.lastError}</div>
      ) : null}

      {snapshot?.labels?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {snapshot.labels.map((l) => (
            <WishGitlabIssueSummaryLabelColoredBadgeSpan key={l.name} label={l} className="rounded-md" />
          ))}
        </div>
      ) : null}

      {snapshot?.webUrl && !isSmartTaskKanbanIssueUrl(snapshot.webUrl) ? (
        <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 dark:border-white/5">
          <a
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            href={snapshot.webUrl}
            target="_blank"
            rel="noreferrer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Abrir no GitLab
          </a>
        </div>
      ) : null}
      {isSmartTaskCard && snapshot?.smartTaskDescriptionMarkdown ? (
        <details className="mt-3 border-t border-black/5 pt-3 dark:border-white/5">
          <summary className="cursor-pointer text-xs font-medium text-zinc-600 dark:text-zinc-400">Notas (Markdown)</summary>
          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
            {snapshot.smartTaskDescriptionMarkdown}
          </pre>
        </details>
      ) : null}

      {props.onMergeGitlabSnapshotAfterDvitu && snapshot?.webUrl ? (
        <WishBoardModalGitlabIssueDvituMatrixScoringFormClient
          open={dvituModalOpen}
          onClose={() => setDvituModalOpen(false)}
          cardId={props.card.id}
          issueUrl={props.card.issueUrl}
          issueTitle={snapshot.title}
          webUrl={snapshot.webUrl}
          onSuccessMergeSnapshot={(cardId, data) => {
            props.onMergeGitlabSnapshotAfterDvitu?.(cardId, data);
          }}
        />
      ) : null}
      {props.onMergeGitlabSnapshotAfterGut && snapshot?.webUrl ? (
        <WishBoardModalGitlabIssueGutMatrixScoringFormClient
          open={gutModalOpen}
          onClose={() => setGutModalOpen(false)}
          cardId={props.card.id}
          issueUrl={props.card.issueUrl}
          issueTitle={snapshot.title}
          webUrl={snapshot.webUrl}
          onSuccessMergeSnapshot={(cardId, data) => {
            props.onMergeGitlabSnapshotAfterGut?.(cardId, data);
          }}
        />
      ) : null}
    </div>
  );
}
