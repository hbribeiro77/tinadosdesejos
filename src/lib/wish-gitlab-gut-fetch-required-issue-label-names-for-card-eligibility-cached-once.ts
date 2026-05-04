import { clientFetchGitlabTriageImportDefaults } from "@/lib/client-fetch-gitlab-triage-import-defaults-api";

let cachedRequiredIssueLabelNames: string[] | null = null;
let inflight: Promise<string[]> | null = null;

const fallbackRequiredIssueLabelNames = (): string[] => ["Triagem de issues", "Bug"];

export function wishGitlabGutFetchRequiredIssueLabelNamesForCardEligibilityCachedOnce(): Promise<string[]> {
  if (cachedRequiredIssueLabelNames) return Promise.resolve(cachedRequiredIssueLabelNames);
  if (!inflight) {
    inflight = clientFetchGitlabTriageImportDefaults()
      .then((d) => {
        const names =
          d?.gutRequiredIssueLabelNames && d.gutRequiredIssueLabelNames.length > 0
            ? d.gutRequiredIssueLabelNames
            : fallbackRequiredIssueLabelNames();
        cachedRequiredIssueLabelNames = names;
        return names;
      })
      .catch(() => {
        const names = fallbackRequiredIssueLabelNames();
        cachedRequiredIssueLabelNames = names;
        return names;
      });
  }
  return inflight;
}
