import { WISH_APP_ACCESS_SESSION_COOKIE_NAME_V1 } from "@/lib/wish-app-access-session-cookie-constants-v1";
import { WISH_APP_ACCESS_SESSION_TTL_SECONDS_V1 } from "@/lib/wish-app-access-session-cookie-constants-v1";

export type WishAppAccessGateSessionCookieSetOptionsV1 = {
  name: typeof WISH_APP_ACCESS_SESSION_COOKIE_NAME_V1;
  value: string;
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  secure: boolean;
};

export function wishAppAccessGateBuildSessionCookieSetOptionsV1(
  signedCookieValue: string,
  options?: { secure?: boolean; maxAgeSeconds?: number },
): WishAppAccessGateSessionCookieSetOptionsV1 {
  return {
    name: WISH_APP_ACCESS_SESSION_COOKIE_NAME_V1,
    value: signedCookieValue,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: options?.maxAgeSeconds ?? WISH_APP_ACCESS_SESSION_TTL_SECONDS_V1,
    secure: options?.secure ?? process.env.NODE_ENV === "production",
  };
}
