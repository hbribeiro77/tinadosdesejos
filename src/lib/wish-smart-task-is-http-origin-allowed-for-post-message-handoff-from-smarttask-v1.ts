/**
 * Origens HTTP autorizadas a enviar handoff para a Tina via `postMessage`.
 * - Com `NEXT_PUBLIC_SMARTTASK_HANDOFF_ALLOWED_ORIGINS` (vírgulas): lista exata.
 * - Sem env em **desenvolvimento** (`NODE_ENV=development`): qualquer `http` em
 *   `localhost` / `127.0.0.1` / `[::1]` (qualquer porta — ex.: Vite 5173 vs Tina 3001).
 * - Sem env em **produção**: apenas localhost na porta 3000 (legado).
 */
export function wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1(origin: string): boolean {
  const raw = process.env.NEXT_PUBLIC_SMARTTASK_HANDOFF_ALLOWED_ORIGINS ?? "";
  if (raw.trim()) {
    const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return list.includes(origin);
  }

  if (process.env.NODE_ENV === "development") {
    try {
      const u = new URL(origin);
      if (
        u.protocol === "http:" &&
        (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]")
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  const defaults = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ];
  return defaults.includes(origin);
}
