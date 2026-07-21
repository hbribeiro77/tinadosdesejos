import { NextResponse } from "next/server";
import { z } from "zod";
import { wishAppAccessGateBuildSessionCookieSetOptionsV1 } from "@/lib/wish-app-access-gate-build-session-cookie-set-options-v1";
import { wishAppAccessGateIsEnabledFromServerEnvV1 } from "@/lib/wish-app-access-gate-is-enabled-from-server-env-v1";
import { wishAppAccessGateLoginAttemptThrottleShouldBlockV1 } from "@/lib/wish-app-access-gate-login-attempt-throttle-in-memory-v1";
import { wishAppAccessSecretReadFromServerEnvV1 } from "@/lib/wish-app-access-secret-read-from-server-env-v1";
import { wishAppAccessSecretTimingSafeMatchesConfiguredV1 } from "@/lib/wish-app-access-secret-timing-safe-matches-configured-v1";
import { wishAppAccessSessionCookieCreateSignedValueV1 } from "@/lib/wish-app-access-session-cookie-create-and-verify-hmac-signed-value-v1";
import { WISH_APP_ACCESS_SESSION_COOKIE_NAME_V1 } from "@/lib/wish-app-access-session-cookie-constants-v1";

const postBodySchema = z.object({
  secret: z.string().min(1),
});

function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  if (!wishAppAccessGateIsEnabledFromServerEnvV1()) {
    return NextResponse.json(
      { ok: false, code: "access_gate_disabled", message: "Portão de acesso não está ativo neste servidor." },
      { status: 400 },
    );
  }

  const clientKey = clientKeyFromRequest(request);
  if (wishAppAccessGateLoginAttemptThrottleShouldBlockV1(clientKey)) {
    return NextResponse.json(
      { ok: false, code: "rate_limited", message: "Muitas tentativas. Aguarde um minuto e tente de novo." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_json", message: "Body JSON inválido." },
      { status: 400 },
    );
  }

  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "invalid_body", message: "Informe o secret." },
      { status: 400 },
    );
  }

  const configured = wishAppAccessSecretReadFromServerEnvV1();
  if (!wishAppAccessSecretTimingSafeMatchesConfiguredV1(parsed.data.secret, configured)) {
    return NextResponse.json(
      { ok: false, code: "invalid_secret", message: "Secret inválido." },
      { status: 401 },
    );
  }

  try {
    const signed = await wishAppAccessSessionCookieCreateSignedValueV1(configured);
    const cookie = wishAppAccessGateBuildSessionCookieSetOptionsV1(signed);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookie);
    return response;
  } catch (error) {
    console.error("wish-app-access-gate-v1 POST:", error);
    return NextResponse.json(
      { ok: false, message: "Falha ao criar sessão de acesso." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: WISH_APP_ACCESS_SESSION_COOKIE_NAME_V1,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
