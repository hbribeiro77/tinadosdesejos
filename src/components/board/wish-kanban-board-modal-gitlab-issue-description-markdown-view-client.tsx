"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import { prepareWishKanbanCardDescriptionMarkdownForClientRenderV1 } from "@/lib/prepare-wish-kanban-card-description-markdown-for-client-render-v1";
import { WishGitlabIssueSummaryLabelColoredBadgeSpan } from "@/components/board/wish-gitlab-issue-summary-label-colored-badge-span";

export type WishKanbanBoardModalGitlabIssueDescriptionMarkdownViewClientProps = {
  open: boolean;
  onClose: () => void;
  snapshot: GitLabIssueSummaryDto | null | undefined;
  descriptionMarkdown: string | null;
  isSmartTaskCard: boolean;
};

const markdownRootClassName =
  "text-sm leading-relaxed text-zinc-800 dark:text-zinc-100 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-violet-700 [&_a]:underline dark:[&_a]:text-violet-300 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-zinc-100 [&_pre]:p-3 dark:[&_pre]:bg-zinc-900 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-3 dark:[&_blockquote]:border-zinc-600";

export function WishKanbanBoardModalGitlabIssueDescriptionMarkdownViewClient(
  props: WishKanbanBoardModalGitlabIssueDescriptionMarkdownViewClientProps,
) {
  const snapshot = props.snapshot;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderedMarkdown = useMemo(() => {
    if (!props.descriptionMarkdown?.trim()) return "";
    return prepareWishKanbanCardDescriptionMarkdownForClientRenderV1(props.descriptionMarkdown, {
      issueWebUrl: snapshot?.webUrl,
      projectPath: snapshot?.projectPath,
    });
  }, [props.descriptionMarkdown, snapshot?.webUrl, snapshot?.projectPath]);

  const handleClose = useCallback(() => {
    props.onClose();
  }, [props]);

  useEffect(() => {
    if (!props.open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [props.open, handleClose]);

  if (!props.open || !mounted) return null;

  const title = snapshot?.title ?? "Issue";
  const webUrl = snapshot?.webUrl;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wish-kanban-issue-description-modal-title"
        className="flex max-h-[min(90vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white text-zinc-900 shadow-lg dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/5 p-5 dark:border-white/10">
          <div className="min-w-0">
            <div id="wish-kanban-issue-description-modal-title" className="text-base font-semibold leading-snug">
              {title}
            </div>
            {snapshot ? (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-medium">{snapshot.projectPath}</span>
                <span className="mx-1.5 opacity-60">#{snapshot.iid}</span>
                <span className="rounded-full bg-zinc-100 px-1.5 py-px text-xs font-medium uppercase dark:bg-zinc-800">
                  {snapshot.state}
                </span>
              </p>
            ) : null}
            {snapshot?.labels?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {snapshot.labels.map((l) => (
                  <WishGitlabIssueSummaryLabelColoredBadgeSpan key={l.name} label={l} className="rounded-md" />
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            onClick={handleClose}
          >
            Fechar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {renderedMarkdown ? (
            <div className={markdownRootClassName}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children, ...rest }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                      {children}
                    </a>
                  ),
                  img: ({ src, alt, ...rest }) => (
                    // eslint-disable-next-line @next/next/no-img-element -- markdown do GitLab via proxy ou espelho local
                    <img
                      src={typeof src === "string" ? src : undefined}
                      alt={alt ?? ""}
                      loading="lazy"
                      className="my-2 max-w-full rounded-md border border-black/10 dark:border-white/10"
                      {...rest}
                    />
                  ),
                }}
              >
                {renderedMarkdown}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {props.isSmartTaskCard
                ? "Este card SmartTask não tem notas na exportação."
                : "Sem descrição no snapshot. Use o botão de atualizar no card para buscar a descrição no GitLab."}
            </p>
          )}
        </div>

        {webUrl ? (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-black/5 p-4 dark:border-white/10">
            <a
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
              href={webUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Abrir no GitLab
            </a>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
