export const WISH_APP_ACCESS_SESSION_COOKIE_NAME_V1 = "wish_app_access_session_v1" as const;

/** Validade da sessão após login bem-sucedido. */
export const WISH_APP_ACCESS_SESSION_TTL_SECONDS_V1 = 7 * 24 * 60 * 60;

export const WISH_APP_ACCESS_GATE_UNAUTHORIZED_CODE_V1 = "access_gate_required" as const;

/** Prefixo do payload assinado no HMAC (evita reuso do digest em outros contextos). */
export const WISH_APP_ACCESS_SESSION_HMAC_PAYLOAD_PREFIX_V1 = "wish-app-access-session-v1:" as const;
