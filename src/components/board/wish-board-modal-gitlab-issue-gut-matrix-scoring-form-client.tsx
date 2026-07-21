"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { clientFetchGitlabApplyGutScoringToGitlabIssueMetadataApi } from "@/lib/client-fetch-gitlab-apply-gut-scoring-to-gitlab-issue-metadata-api";
import { gitlabGutComputePartialProductFromOptionalScores } from "@/lib/gitlab-gut-compute-product-and-partial-product-from-g-u-t-scores";
import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import { GITLAB_GUT_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1 } from "@/lib/gitlab-gut-matrix-criteria-descriptions-by-axis-and-score-one-to-five-pt-br-v1";
import {
  WishMatrixScoringModalAxisRadioGroupLegendBoldTitleWithOptionalParentheticalTooltipClient,
  WishMatrixScoringModalInlineParentheticalHintAsInfoIconSpanClient,
} from "./wish-matrix-scoring-modal-legend-bold-title-and-inline-info-tooltip-span-client";
import { useLockDocumentBodyScrollWhileTruthyForModalOverlay } from "@/lib/use-lock-document-body-scroll-while-truthy-for-modal-overlay";

type WishBoardModalGitlabIssueGutMatrixScoringFormClientProps = {
  open: boolean;
  onClose: () => void;
  issueUrl: string;
  issueTitle: string;
  webUrl: string;
  cardId: string;
  onSuccessMergeSnapshot: (cardId: string, data: GitLabIssueSummaryDto) => void;
};

type AxisScores = { g: number | null; u: number | null; t: number | null };

const emptyScores: AxisScores = { g: null, u: null, t: null };

export function WishBoardModalGitlabIssueGutMatrixScoringFormClient(props: WishBoardModalGitlabIssueGutMatrixScoringFormClientProps) {
  const [scores, setScores] = useState<AxisScores>(emptyScores);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!props.open) return;
    setScores(emptyScores);
    setSubmitting(false);
    setError(null);
  }, [props.open, props.cardId]);

  useLockDocumentBodyScrollWhileTruthyForModalOverlay(props.open);

  const partial = useMemo(
    () =>
      gitlabGutComputePartialProductFromOptionalScores({
        g: scores.g,
        u: scores.u,
        t: scores.t,
      }),
    [scores],
  );

  const canSubmit = scores.g != null && scores.u != null && scores.t != null;

  const onSubmit = useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await clientFetchGitlabApplyGutScoringToGitlabIssueMetadataApi({
        issueUrl: props.issueUrl,
        g: scores.g!,
        u: scores.u!,
        t: scores.t!,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      props.onSuccessMergeSnapshot(props.cardId, res.data);
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao submeter a matriz.");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, submitting, props, scores]);

  if (!props.open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-black/10 bg-white text-zinc-900 shadow-lg dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/5 p-5 dark:border-white/10">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
            <div className="flex shrink-0 flex-col">
              <div className="text-base font-semibold">Matriz GUT</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-bold text-zinc-600 dark:text-zinc-300">Nota final = G×U×T</span>
                <WishMatrixScoringModalInlineParentheticalHintAsInfoIconSpanClient hint="cada eixo de 1 a 5" />
              </div>
            </div>
            <div className="hidden h-auto min-h-[2.5rem] w-px shrink-0 bg-black/10 sm:block dark:bg-white/15" aria-hidden />
            <div className="h-px w-full shrink-0 bg-black/10 sm:hidden dark:bg-white/15" aria-hidden />
            <div className="min-w-0 flex-1 pt-0.5 sm:self-start">
              <a
                className="group inline max-w-full rounded-md text-left align-top outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-amber-500 dark:ring-offset-zinc-950"
                href={props.webUrl}
                target="_blank"
                rel="noreferrer"
                title="Abrir issue no GitLab (nova aba)"
              >
                <span className="text-lg font-bold leading-snug text-zinc-900 underline-offset-[3px] break-words group-hover:underline dark:text-zinc-50">
                  {props.issueTitle}
                </span>
                <span
                  className="ms-1.5 inline-flex shrink-0 translate-y-px align-middle rounded border border-black/15 bg-zinc-50 p-1 text-zinc-600 dark:border-white/15 dark:bg-zinc-900/80 dark:text-zinc-400"
                  aria-hidden
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            onClick={() => {
              if (submitting) return;
              props.onClose();
            }}
          >
            Fechar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5">
          <div className="space-y-6">
            {GITLAB_GUT_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1.map((axis) => (
              <fieldset key={axis.key} className="space-y-2 border-0 p-0">
                <legend className="w-full min-w-0 border-0 p-0">
                  <WishMatrixScoringModalAxisRadioGroupLegendBoldTitleWithOptionalParentheticalTooltipClient
                    radioGroupLegend={axis.radioGroupLegend}
                  />
                </legend>
                <div className="space-y-2">
                  {axis.descriptionsByScoreOneToFive.map((desc, idx) => {
                    const value = (idx + 1) as 1 | 2 | 3 | 4 | 5;
                    const id = `gut-${props.cardId}-${axis.key}-${value}`;
                    return (
                      <label
                        key={value}
                        htmlFor={id}
                        className="flex cursor-pointer gap-2 rounded-md border border-black/10 bg-white p-2 text-xs leading-snug hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900/80"
                      >
                        <input
                          id={id}
                          type="radio"
                          className="mt-0.5 shrink-0"
                          name={`gut-${props.cardId}-${axis.key}`}
                          checked={scores[axis.key] === value}
                          onChange={() => setScores((prev) => ({ ...prev, [axis.key]: value }))}
                        />
                        <span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{value}</span>
                          <span className="text-zinc-600 dark:text-zinc-400"> — {desc}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          {error ? <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div> : null}
        </div>

        <div className="shrink-0 border-t border-black/10 bg-zinc-50/95 dark:border-white/10 dark:bg-zinc-900/90">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
            <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Nota em formação</span>
              <WishMatrixScoringModalInlineParentheticalHintAsInfoIconSpanClient hint="G×U×T" />
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-end gap-2 sm:flex-initial">
              <span className="text-2xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                {partial != null ? partial : "—"}
              </span>
              {!canSubmit ? (
                <span className="shrink-0 text-right text-xs leading-snug text-zinc-500 whitespace-nowrap dark:text-zinc-500">
                  Preencha os três eixos para ver a nota final.
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-800 dark:text-amber-400">Pronta para enviar</span>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-black/10 px-4 py-3 dark:border-white/10">
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
              disabled={submitting}
              onClick={() => props.onClose()}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
              disabled={!canSubmit || submitting}
              onClick={() => void onSubmit()}
            >
              {submitting ? "Enviando…" : "Submeter nota"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
