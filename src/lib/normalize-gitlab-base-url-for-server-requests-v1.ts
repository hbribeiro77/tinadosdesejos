export function normalizeGitlabBaseUrlForServerRequestsV1(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/** @deprecated Use `normalizeGitlabBaseUrlForServerRequestsV1`. */
export function normalizeGitlabBaseUrl(raw: string): string {
  return normalizeGitlabBaseUrlForServerRequestsV1(raw);
}
