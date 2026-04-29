import { NextResponse } from "next/server";

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
  });
}
