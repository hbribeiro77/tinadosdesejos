import { formatIso8601DateTimeForUiDisplayBrazilLocaleShort } from "@/lib/format-iso-8601-date-time-for-ui-display-brazil-locale-short";

export type WishGitlabIssueCreatedAtMetadataDisplayBadgeTone = "sky" | "violet" | "teal";

const TONE_CLASS_BY_KIND: Record<
  WishGitlabIssueCreatedAtMetadataDisplayBadgeTone,
  string
> = {
  sky: [
    "border-sky-300/90 bg-sky-50 text-sky-900 shadow-sm shadow-sky-500/10",
    "ring-1 ring-sky-400/25 dark:border-sky-500/45 dark:bg-sky-950/55 dark:text-sky-50",
    "dark:shadow-sky-900/40 dark:ring-sky-400/15",
  ].join(" "),
  violet: [
    "border-violet-300/90 bg-violet-50 text-violet-900 shadow-sm shadow-violet-500/10",
    "ring-1 ring-violet-400/25 dark:border-violet-500/45 dark:bg-violet-950/50 dark:text-violet-50",
    "dark:shadow-violet-900/40 dark:ring-violet-400/15",
  ].join(" "),
  teal: [
    "border-teal-300/90 bg-teal-50 text-teal-900 shadow-sm shadow-teal-500/10",
    "ring-1 ring-teal-400/25 dark:border-teal-500/45 dark:bg-teal-950/50 dark:text-teal-50",
    "dark:shadow-teal-900/40 dark:ring-teal-400/15",
  ].join(" "),
};

type WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariantsProps = {
  iso8601: string;
  tone: WishGitlabIssueCreatedAtMetadataDisplayBadgeTone;
  /** Texto do tooltip (ex.: explicar `created_at` no GitLab). */
  title?: string;
  className?: string;
};

/**
 * Badge compacta para data/hora de criação da issue, com tom alinhado ao contexto (quadro, triagem, SmartTask).
 */
export function WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariants(
  props: WishGitlabIssueCreatedAtMetadataDisplayBadgeSpanWithSkyVioletTealToneVariantsProps,
) {
  const formatted = formatIso8601DateTimeForUiDisplayBrazilLocaleShort(props.iso8601);
  return (
    <span
      className={[
        "inline-flex max-w-full items-center gap-1 truncate rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-none tracking-tight",
        TONE_CLASS_BY_KIND[props.tone],
        props.className ?? "",
      ].join(" ")}
      title={props.title ?? `Criada em ${formatted} (GitLab created_at)`}
    >
      <span className="font-semibold opacity-90">Criada</span>
      <span className="font-medium opacity-95">{formatted}</span>
    </span>
  );
}
