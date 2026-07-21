import { WISH_APP_ACCESS_SESSION_HMAC_PAYLOAD_PREFIX_V1 } from "@/lib/wish-app-access-session-cookie-constants-v1";
import { WISH_APP_ACCESS_SESSION_TTL_SECONDS_V1 } from "@/lib/wish-app-access-session-cookie-constants-v1";

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToHex(sig);
}

/** Cookie value: `{expUnixSeconds}.{hmacHex}` — Edge-safe (Web Crypto). */
export async function wishAppAccessSessionCookieCreateSignedValueV1(
  accessSecret: string,
  options?: { nowUnixSeconds?: number; ttlSeconds?: number },
): Promise<string> {
  const secret = accessSecret.trim();
  if (!secret) {
    throw new Error("WISH_APP_ACCESS_SECRET vazio: não é possível assinar sessão.");
  }
  const now = options?.nowUnixSeconds ?? Math.floor(Date.now() / 1000);
  const ttl = options?.ttlSeconds ?? WISH_APP_ACCESS_SESSION_TTL_SECONDS_V1;
  const exp = now + ttl;
  const payload = `${WISH_APP_ACCESS_SESSION_HMAC_PAYLOAD_PREFIX_V1}${exp}`;
  const hmac = await hmacSha256Hex(secret, payload);
  return `${exp}.${hmac}`;
}

export async function wishAppAccessSessionCookieVerifySignedValueV1(
  cookieValue: string | undefined | null,
  accessSecret: string,
  options?: { nowUnixSeconds?: number },
): Promise<boolean> {
  const secret = accessSecret.trim();
  if (!secret) return false;
  if (typeof cookieValue !== "string" || !cookieValue.trim()) return false;

  const match = /^(\d+)\.([a-f0-9]{64})$/i.exec(cookieValue.trim());
  if (!match) return false;

  const exp = Number(match[1]);
  const providedHmac = match[2]!.toLowerCase();
  if (!Number.isFinite(exp)) return false;

  const now = options?.nowUnixSeconds ?? Math.floor(Date.now() / 1000);
  if (exp < now) return false;

  const payload = `${WISH_APP_ACCESS_SESSION_HMAC_PAYLOAD_PREFIX_V1}${exp}`;
  const expectedHmac = await hmacSha256Hex(secret, payload);
  return timingSafeEqualHex(expectedHmac, providedHmac);
}
