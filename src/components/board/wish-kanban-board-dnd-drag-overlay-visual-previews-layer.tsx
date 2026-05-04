"use client";

import {
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from "@dnd-kit/core";
import { WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariants } from "@/components/board/wish-gitlab-issue-created-at-metadata-display-badge-span-with-sky-violet-teal-tone-variants";
import { WishGitlabIssueSummaryLabelColoredBadgeSpan } from "@/components/board/wish-gitlab-issue-summary-label-colored-badge-span";
import type { GitLabIssueLabelSummaryDto, GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import type { WishKanbanCard } from "@/lib/wish-kanban-board-domain-types";
import { isSmartTaskKanbanIssueUrl } from "@/lib/smart-task-kanban-issue-url-build-and-parse-task-id";

const dropAnimation: DropAnimation = {
  duration: 200,
  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.32" } },
  }),
};

export type WishKanbanBoardDndActiveDragOverlayModel =
  | { kind: "card"; card: WishKanbanCard }
  | { kind: "column"; title: string }
  | { kind: "triage"; preview: GitLabIssueSummaryDto }
  | { kind: "triageSmartTask"; preview: GitLabIssueSummaryDto };

type WishKanbanBoardDndDragOverlayVisualPreviewsLayerProps = {
  active: WishKanbanBoardDndActiveDragOverlayModel | null;
};

function WishKanbanBoardDndDragOverlayIssueLabelsBlock(props: { labels: GitLabIssueLabelSummaryDto[] | undefined }) {
  if (!props.labels?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {props.labels.map((l) => (
        <WishGitlabIssueSummaryLabelColoredBadgeSpan key={l.name} label={l} className="rounded-md" />
      ))}
    </div>
  );
}

function WishKanbanBoardDndDragOverlayCardPreview(props: { card: WishKanbanCard }) {
  const snapshot = props.card.snapshot?.data;
  return (
    <div className="pointer-events-none w-[min(380px,92vw)] cursor-grabbing rounded-xl border-2 border-sky-500/50 bg-white p-3 shadow-2xl ring-2 ring-sky-400/30 dark:border-sky-400/55 dark:bg-zinc-950 dark:ring-sky-400/25">
      <div className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
        {snapshot?.title ?? "Carregando issue..."}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        {snapshot ? (
          <>
            <span>
              #{snapshot.iid} <span className="mx-1 opacity-50">•</span> {snapshot.state}
            </span>
            {!isSmartTaskKanbanIssueUrl(snapshot.webUrl) && snapshot.createdAt ? (
              <WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariants
                iso8601={snapshot.createdAt}
                tone="sky"
              />
            ) : null}
          </>
        ) : (
          <span className="break-all">{props.card.issueUrl}</span>
        )}
      </div>
      {props.card.lastError ? (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">{props.card.lastError}</div>
      ) : null}
      <WishKanbanBoardDndDragOverlayIssueLabelsBlock labels={snapshot?.labels} />
    </div>
  );
}

function WishKanbanBoardDndDragOverlayTriagePreview(props: { preview: GitLabIssueSummaryDto }) {
  return (
    <div className="pointer-events-none w-[min(380px,92vw)] cursor-grabbing rounded-xl border-2 border-violet-500/50 bg-white p-3 shadow-2xl ring-2 ring-violet-400/30 dark:border-violet-400/55 dark:bg-zinc-950 dark:ring-violet-400/25">
      <div className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{props.preview.title}</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        <span>
          {props.preview.projectPath}#{props.preview.iid}
        </span>
        <WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariants
          iso8601={props.preview.createdAt}
          tone="violet"
        />
      </div>
      <WishKanbanBoardDndDragOverlayIssueLabelsBlock labels={props.preview.labels} />
    </div>
  );
}

function WishKanbanBoardDndDragOverlayTriageSmartTaskPreview(props: { preview: GitLabIssueSummaryDto }) {
  return (
    <div className="pointer-events-none w-[min(380px,92vw)] cursor-grabbing rounded-xl border-2 border-teal-500/50 bg-white p-3 shadow-2xl ring-2 ring-teal-400/30 dark:border-teal-400/55 dark:bg-zinc-950 dark:ring-teal-400/25">
      <div className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{props.preview.title}</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        <span>
          {props.preview.projectPath}#{props.preview.iid}
        </span>
        <WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariants
          iso8601={props.preview.createdAt}
          tone="teal"
        />
      </div>
      <WishKanbanBoardDndDragOverlayIssueLabelsBlock labels={props.preview.labels} />
    </div>
  );
}

function WishKanbanBoardDndDragOverlayColumnPreview(props: { title: string }) {
  return (
    <div className="pointer-events-none flex min-w-[220px] max-w-[min(380px,92vw)] cursor-grabbing items-center gap-2 rounded-xl border-2 border-amber-500/55 bg-zinc-50 px-4 py-3 shadow-2xl ring-2 ring-amber-400/25 dark:border-amber-400/50 dark:bg-zinc-900 dark:ring-amber-400/20">
      <span className="select-none text-sm leading-none tracking-tighter text-zinc-400 dark:text-zinc-500">⋮⋮</span>
      <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{props.title}</span>
    </div>
  );
}

export function WishKanbanBoardDndDragOverlayVisualPreviewsLayer(
  props: WishKanbanBoardDndDragOverlayVisualPreviewsLayerProps,
) {
  const { active } = props;

  return (
    <DragOverlay dropAnimation={dropAnimation}>
      {active?.kind === "card" ? <WishKanbanBoardDndDragOverlayCardPreview card={active.card} /> : null}
      {active?.kind === "triage" ? <WishKanbanBoardDndDragOverlayTriagePreview preview={active.preview} /> : null}
      {active?.kind === "triageSmartTask" ? (
        <WishKanbanBoardDndDragOverlayTriageSmartTaskPreview preview={active.preview} />
      ) : null}
      {active?.kind === "column" ? <WishKanbanBoardDndDragOverlayColumnPreview title={active.title} /> : null}
    </DragOverlay>
  );
}
