type Bucket = { windowStartedAtMs: number; count: number };

const bucketsByKey = new Map<string, Bucket>();

const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_WINDOW_MS = 60_000;

/** Retorna true se a tentativa deve ser bloqueada (throttle). */
export function wishAppAccessGateLoginAttemptThrottleShouldBlockV1(
  clientKey: string,
  options?: {
    nowMs?: number;
    maxAttempts?: number;
    windowMs?: number;
    store?: Map<string, Bucket>;
  },
): boolean {
  const now = options?.nowMs ?? Date.now();
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const store = options?.store ?? bucketsByKey;
  const key = clientKey.trim() || "unknown";

  const existing = store.get(key);
  if (!existing || now - existing.windowStartedAtMs >= windowMs) {
    store.set(key, { windowStartedAtMs: now, count: 1 });
    return false;
  }

  existing.count += 1;
  store.set(key, existing);
  return existing.count > maxAttempts;
}

/** Só testes: limpa o store global. */
export function wishAppAccessGateLoginAttemptThrottleResetStoreForTestsV1(): void {
  bucketsByKey.clear();
}
