"use client";

import type { ReactNode } from "react";
import { splitMatrixRadioGroupLegendIntoBoldTitleAndParentheticalHintForModalUiPtBr } from "@/lib/split-matrix-radio-group-legend-into-bold-title-and-parenthetical-hint-for-modal-ui-pt-br";

/** Marcador (i) com `title` nativo para o texto que antes ficava entre parênteses. */
export function WishMatrixScoringModalInlineParentheticalHintAsInfoIconSpanClient(props: {
  hint: string;
  /** Padrão: "(i)" — pode usar "(?)" se preferir. */
  marker?: string;
}) {
  const marker = props.marker ?? "(i)";
  return (
    <span
      title={props.hint}
      className="inline-flex shrink-0 cursor-help select-none text-xs font-normal text-zinc-500 underline decoration-dotted decoration-zinc-400 underline-offset-2 dark:text-zinc-400 dark:decoration-zinc-500"
      aria-label={props.hint}
    >
      {marker}
    </span>
  );
}

/** Legenda de eixo: nome em negrito + (i) com tooltip quando existir texto entre parênteses em `radioGroupLegend`. */
export function WishMatrixScoringModalAxisRadioGroupLegendBoldTitleWithOptionalParentheticalTooltipClient(props: {
  radioGroupLegend: string;
  children?: ReactNode;
}) {
  const { title, parentheticalHint } = splitMatrixRadioGroupLegendIntoBoldTitleAndParentheticalHintForModalUiPtBr(
    props.radioGroupLegend,
  );
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-zinc-800 dark:text-zinc-200">
      <span className="font-bold">{title}</span>
      {parentheticalHint ? <WishMatrixScoringModalInlineParentheticalHintAsInfoIconSpanClient hint={parentheticalHint} /> : null}
      {props.children}
    </span>
  );
}
