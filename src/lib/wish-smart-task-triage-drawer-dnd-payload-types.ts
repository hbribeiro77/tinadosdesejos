import type { GitLabIssueSummaryDto } from "@/lib/gitlab-issue-summary-dto-types";

export const WISH_SMARTTASK_TRIAGE_DND_KIND = "wishSmartTaskTriageFromDrawer" as const;

export type WishSmartTaskTriageDrawerDnDPayload = {
  kind: typeof WISH_SMARTTASK_TRIAGE_DND_KIND;
  issueUrl: string;
  preview: GitLabIssueSummaryDto;
};

export function wishSmartTaskTriageDrawerDnDActiveId(taskId: string) {
  return `wish-triage-smarttask:${encodeURIComponent(taskId)}`;
}
