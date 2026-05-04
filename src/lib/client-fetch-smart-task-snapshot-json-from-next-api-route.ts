export async function clientFetchSmartTaskSnapshotJsonFromNextApiRoute(): Promise<
  | { ok: true; jsonText: string }
  | { ok: false; message: string; status: number }
> {
  const res = await fetch("/api/smarttask/snapshot", { method: "GET", cache: "no-store" });
  const text = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { message?: string };
      return { ok: false, message: typeof j.message === "string" ? j.message : text, status: res.status };
    } catch {
      return { ok: false, message: text || `Erro HTTP ${res.status}`, status: res.status };
    }
  }
  return { ok: true, jsonText: text };
}
