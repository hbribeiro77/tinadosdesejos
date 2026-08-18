import { NextResponse, type NextRequest } from "next/server";
import { wishAppAccessGateIsEnabledFromServerEnvV1 } from "@/lib/wish-app-access-gate-is-enabled-from-server-env-v1";
import { wishAppAccessGatePathAllowsBoardImportPutWithBearerWithoutSessionCookieV1 } from "@/lib/wish-app-access-gate-path-allows-board-import-put-with-bearer-without-session-cookie-v1";
import { wishAppAccessGatePathIsPublicAllowlistV1 } from "@/lib/wish-app-access-gate-path-is-public-allowlist-v1";
import { wishAppAccessSecretReadFromServerEnvV1 } from "@/lib/wish-app-access-secret-read-from-server-env-v1";
import {
  WISH_APP_ACCESS_GATE_UNAUTHORIZED_CODE_V1,
  WISH_APP_ACCESS_SESSION_COOKIE_NAME_V1,
} from "@/lib/wish-app-access-session-cookie-constants-v1";
import { wishAppAccessSessionCookieVerifySignedValueV1 } from "@/lib/wish-app-access-session-cookie-create-and-verify-hmac-signed-value-v1";

export async function middleware(request: NextRequest) {
  if (!wishAppAccessGateIsEnabledFromServerEnvV1()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (wishAppAccessGatePathIsPublicAllowlistV1(pathname)) {
    return NextResponse.next();
  }

  if (
    wishAppAccessGatePathAllowsBoardImportPutWithBearerWithoutSessionCookieV1({
      pathname,
      method: request.method,
      authorizationHeader: request.headers.get("authorization"),
    })
  ) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(WISH_APP_ACCESS_SESSION_COOKIE_NAME_V1)?.value;
  const secret = wishAppAccessSecretReadFromServerEnvV1();
  const ok = await wishAppAccessSessionCookieVerifySignedValueV1(cookieValue, secret);
  if (ok) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        ok: false,
        code: WISH_APP_ACCESS_GATE_UNAUTHORIZED_CODE_V1,
        message: "Acesso negado: informe o secret em /entrar.",
      },
      { status: 401 },
    );
  }

  const entrar = request.nextUrl.clone();
  entrar.pathname = "/entrar";
  entrar.search = "";
  return NextResponse.redirect(entrar);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
