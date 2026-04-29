import type { GitLabIssueLabelSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";
import {
  normalizeGitLabIssueLabelBackgroundColor,
  wishGitlabIssueLabelColoredPillInlineStyles,
} from "@/lib/wish-gitlab-issue-label-normalize-hex-background-and-compute-contrast-foreground";

type WishGitlabIssueSummaryLabelColoredBadgeSpanProps = {
  label: GitLabIssueLabelSummaryDto;
  className?: string;
};

/**
 * Badge de label com a cor vinda do GitLab quando disponível; fallback neutro quando `color` é nulo.
 */
export function WishGitlabIssueSummaryLabelColoredBadgeSpan(props: WishGitlabIssueSummaryLabelColoredBadgeSpanProps) {
  const bg = normalizeGitLabIssueLabelBackgroundColor(props.label.color);
  const colored = bg ? wishGitlabIssueLabelColoredPillInlineStyles(bg) : null;

  return (
    <span
      className={[
        "inline-flex max-w-full truncate border px-2 py-0.5 text-[11px] font-medium",
        colored
          ? ""
          : "border-black/10 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300",
        props.className ?? "",
      ].join(" ")}
      style={colored ?? undefined}
      title={props.label.name}
    >
      {props.label.name}
    </span>
  );
}
