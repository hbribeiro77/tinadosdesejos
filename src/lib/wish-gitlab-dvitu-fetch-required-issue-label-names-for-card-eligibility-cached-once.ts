import { clientFetchGitlabTriageImportDefaults } from "@/lib/client-fetch-gitlab-triage-import-defaults-api";

let cachedRequiredIssueLabelNames: string[] | null = null;
let inflight: Promise<string[]> | null = null;

const fallbackRequiredIssueLabelNames = (): string[] => ["Triagem de issues", "Melhoria"];

/** Uma única chamada à API de defaults para todos os cards do board. */
export function wishGitlabDvituFetchRequiredIssueLabelNamesForCardEligibilityCachedOnce(): Promise<string[]> {
  if (cachedRequiredIssueLabelNames) return Promise.resolve(cachedRequiredIssueLabelNames);
  if (!inflight) {
    inflight = clientFetchGitlabTriageImportDefaults()
      .then((d) => {
        const names =
          d?.dvituRequiredIssueLabelNames && d.dvituRequiredIssueLabelNames.length > 0
            ? d.dvituRequiredIssueLabelNames
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
