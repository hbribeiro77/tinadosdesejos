"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import { WishGitlabIssueSummaryLabelColoredBadgeSpan } from "@/components/board/wish-gitlab-issue-summary-label-colored-badge-span";
import {
  WISH_SMARTTASK_TRIAGE_DND_KIND,
  wishSmartTaskTriageDrawerDnDActiveId,
  type WishSmartTaskTriageDrawerDnDPayload,
} from "@/lib/wish-smart-task-triage-drawer-dnd-payload-types";

type WishSmartTaskTriageDraggableRowFromDrawerProps = {
  preview: GitLabIssueSummaryDto;
  taskId: string;
};

export function WishSmartTaskTriageDraggableRowFromDrawer(props: WishSmartTaskTriageDraggableRowFromDrawerProps) {
  const activeId = wishSmartTaskTriageDrawerDnDActiveId(props.taskId);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activeId,
    data: {
      kind: WISH_SMARTTASK_TRIAGE_DND_KIND,
      issueUrl: props.preview.webUrl,
      preview: props.preview,
    } satisfies WishSmartTaskTriageDrawerDnDPayload,
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
          ? "border-dashed border-teal-500/45 bg-teal-50/70 opacity-30 ring-2 ring-teal-400/35 dark:border-teal-400/45 dark:bg-teal-950/30 dark:ring-teal-500/25"
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
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            {props.preview.projectPath}#{props.preview.iid}
          </div>
          {props.preview.labels?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {props.preview.labels.map((l) => (
                <WishGitlabIssueSummaryLabelColoredBadgeSpan key={l.name} label={l} className="rounded-full" />
              ))}
            </div>
          ) : null}
        </button>
      </div>
    </div>
  );
}
