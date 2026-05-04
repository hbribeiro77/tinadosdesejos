import { NextResponse } from "next/server";
import { gitlabDvituRequiredIssueLabelNamesForPlayButtonAndSubmitFromEnv } from "@/lib/gitlab-dvitu-read-required-label-names-from-env-for-eligibility-and-removal";
import { gitlabGutRequiredIssueLabelNamesForPlayButtonAndSubmitFromEnv } from "@/lib/gitlab-gut-read-required-label-names-from-env-for-eligibility-and-removal";

/** Expõe apenas defaults não secretos para preencher a UI da gaveta de importação. */
export async function GET() {
  const defaultImportLabelsCsv = (process.env.GITLAB_TRIAGE_LABEL ?? "Triagem de issues").trim();
  const groupPathDisplay = (process.env.GITLAB_TRIAGE_GROUP_PATH ?? "portal-da-defensoria").trim();

  const createIssueProjectPathDisplay = (
    process.env.GITLAB_CREATE_ISSUE_PROJECT_PATH ?? "portal-da-defensoria/portal-defensoria-gateway"
  ).trim();

  const createIssueDefaultLabelsDisplay = (() => {
    const raw = (process.env.GITLAB_CREATE_ISSUE_DEFAULT_LABELS ?? "squad::bravo").trim();
    if (!raw) return "";
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
  })();

  return NextResponse.json({
    defaultImportLabelsCsv,
    groupPathDisplay,
    createIssueProjectPathDisplay,
    createIssueDefaultLabelsDisplay,
    /** GitLab lista por grupo: várias labels no parâmetro = AND (todas devem estar na issue). */
    labelsJoinOperator: "and" as const,
    /** Labels que precisam estar na issue para o botão DVITU (triagem env + Melhoria). */
    dvituRequiredIssueLabelNames: gitlabDvituRequiredIssueLabelNamesForPlayButtonAndSubmitFromEnv(),
    /** Labels que precisam estar na issue para o botão GUT (triagem env + Bug). */
    gutRequiredIssueLabelNames: gitlabGutRequiredIssueLabelNamesForPlayButtonAndSubmitFromEnv(),
  });
}
