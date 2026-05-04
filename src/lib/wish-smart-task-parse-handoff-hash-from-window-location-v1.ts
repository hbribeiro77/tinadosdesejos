import { parseSmartTaskBackupJsonTextValidateWithZodAndNormalizeTasks } from "@/lib/parse-smart-task-backup-json-text-validate-with-zod-and-normalize-tasks";
import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";

export type ParseWishSmartTaskHandoffHashFromWindowLocationV1Result =
  | { ok: true; tasks: SmartTaskNormalizedTask[] }
  | { ok: false; message: string };

function decodeBase64OrBase64UrlPayloadToUtf8String(payload: string): string {
  const s = payload.trim();
  if (!s) throw new Error("Payload vazio.");
  if (typeof Buffer !== "undefined") {
    try {
      return Buffer.from(s, "base64url").toString("utf8");
    } catch {
      try {
        return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
      } catch (e2) {
        throw e2 instanceof Error ? e2 : new Error("Base64 inválido.");
      }
    }
  }
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (b64.length % 4)) % 4;
  b64 += "=".repeat(pad);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/**
 * Extrai o valor de `st-handoff` do hash e/ou da query **sem** `URLSearchParams`:
 * em strings estilo formulário, `+` é tratado como espaço e corrompe Base64 clássico.
 */
export function extractWishSmartTaskStHandoffPayloadRawFromHashAndSearchStringV1(
  hashFragment: string,
  searchQueryString: string,
): string | null {
  const segments = [hashFragment, searchQueryString];
  for (const segment of segments) {
    const inner = segment.startsWith("#")
      ? segment.slice(1)
      : segment.startsWith("?")
        ? segment.slice(1)
        : segment;
    if (!inner.trim()) continue;
    const m = inner.match(/(?:^|[&#])st-handoff=([^&]*)/);
    if (!m?.[1]) continue;
    let raw = m[1];
    try {
      raw = decodeURIComponent(raw);
    } catch {
      /* mantém */
    }
    const t = raw.trim();
    if (t) return t;
  }
  return null;
}

/**
 * Lê `window.location.hash` e opcionalmente `window.location.search` com
 * `st-handoff=<Base64 / Base64URL(UTF-8)>`; valida com o mesmo pipeline do backup JSON.
 */
export function parseWishSmartTaskHandoffHashFromWindowLocationV1(
  rawHash: string,
  searchQueryString = "",
): ParseWishSmartTaskHandoffHashFromWindowLocationV1Result {
  const payload = extractWishSmartTaskStHandoffPayloadRawFromHashAndSearchStringV1(
    rawHash,
    searchQueryString,
  );
  if (payload == null || payload === "") {
    return { ok: false, message: "Parâmetro st-handoff ausente." };
  }
  let jsonText: string;
  try {
    jsonText = decodeBase64OrBase64UrlPayloadToUtf8String(payload);
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Não foi possível decodificar o handoff.",
    };
  }
  const r = parseSmartTaskBackupJsonTextValidateWithZodAndNormalizeTasks(jsonText);
  if (!r.ok) return { ok: false, message: r.message };
  return { ok: true, tasks: r.tasks };
}
