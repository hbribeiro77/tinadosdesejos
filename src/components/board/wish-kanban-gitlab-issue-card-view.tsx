"use client";

import { useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WishGitlabIssueSummaryLabelColoredBadgeSpan } from "@/components/board/wish-gitlab-issue-summary-label-colored-badge-span";
import type { WishKanbanCard } from "@/lib/wish-kanban-board-domain-types";

type WishKanbanGitlabIssueCardViewProps = {
  card: WishKanbanCard;
  onRemove: (cardId: string) => void;
  onRefresh: (cardId: string) => Promise<void>;
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
  const snapshot = props.card.snapshot?.data;
  const mutedBySearch = Boolean(props.mutedByBoardSearch);

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
          <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {snapshot ? (
              <>
                <span className="font-medium text-zinc-600 dark:text-zinc-300">{snapshot.projectPath}</span>
                <span className="opacity-80">#{snapshot.iid}</span>
                <span className="mx-1 opacity-50">•</span>
                {snapshot.state}
              </>
            ) : (
              <span className="break-all">{props.card.issueUrl}</span>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-black/5 hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-300"
            disabled={refreshing}
            title="Atualizar dados da issue"
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

      {snapshot?.webUrl ? (
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
    </div>
  );
}
