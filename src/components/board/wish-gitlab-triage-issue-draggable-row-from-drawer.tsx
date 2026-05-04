"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import { WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariants } from "@/components/board/wish-gitlab-issue-created-at-metadata-display-badge-span-with-sky-violet-teal-tone-variants";
import { WishGitlabIssueSummaryLabelColoredBadgeSpan } from "@/components/board/wish-gitlab-issue-summary-label-colored-badge-span";
import {
  WISH_GITLAB_TRIAGE_DND_KIND,
  wishGitlabTriageDrawerDnDActiveId,
  type WishGitlabTriageDrawerDnDPayload,
} from "@/lib/wish-gitlab-triage-drawer-dnd-payload-types";

type WishGitlabTriageIssueDraggableRowFromDrawerProps = {
  preview: GitLabIssueSummaryDto;
};

export function WishGitlabTriageIssueDraggableRowFromDrawer(props: WishGitlabTriageIssueDraggableRowFromDrawerProps) {
  const activeId = wishGitlabTriageDrawerDnDActiveId(props.preview);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activeId,
    data: {
      kind: WISH_GITLAB_TRIAGE_DND_KIND,
      issueUrl: props.preview.webUrl,
      preview: props.preview,
    } satisfies WishGitlabTriageDrawerDnDPayload,
  });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
    }),
    [transform],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-lg border border-black/10 bg-white p-3 text-left shadow-sm dark:border-white/10 dark:bg-zinc-950",
        isDragging
          ? "border-dashed border-violet-500/45 bg-violet-50/70 opacity-30 ring-2 ring-violet-400/35 dark:border-violet-400/45 dark:bg-violet-950/30 dark:ring-violet-500/25"
          : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 cursor-grab text-left active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          <div className="text-sm font-semibold leading-snug">{props.preview.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <span>
              {props.preview.projectPath}#{props.preview.iid}
            </span>
            <WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariants
              iso8601={props.preview.createdAt}
              tone="violet"
            />
          </div>
          {props.preview.labels?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {props.preview.labels.map((l) => (
                <WishGitlabIssueSummaryLabelColoredBadgeSpan key={l.name} label={l} className="rounded-full" />
              ))}
            </div>
          ) : null}
        </button>
        <a
          href={props.preview.webUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 rounded-md p-1.5 text-violet-700 hover:bg-violet-100/80 dark:text-violet-300 dark:hover:bg-violet-900/50"
          title="Abrir no GitLab"
          aria-label={`Abrir issue no GitLab: ${props.preview.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    </div>
  );
}
