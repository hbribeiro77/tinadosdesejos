import { NextResponse } from "next/server";
import { wishViewOnlyModeReadServerEnvFlagV1 } from "@/lib/wish-view-only-mode-read-server-env-flag-v1";

export const WISH_VIEW_ONLY_MODE_ERROR_CODE_V1 = "view_only_mode" as const;

export type WishViewOnlyModeJsonErrorBodyV1 = {
  ok: false;
  code: typeof WISH_VIEW_ONLY_MODE_ERROR_CODE_V1;
  message: string;
};

export function wishViewOnlyModeBuildJsonErrorBodyV1(
  message = "Tina está em modo visualização: esta ação não é permitida neste servidor.",
): WishViewOnlyModeJsonErrorBodyV1 {
  return {
    ok: false,
    code: WISH_VIEW_ONLY_MODE_ERROR_CODE_V1,
    message,
  };
}

/** Se `WISH_VIEW_ONLY_MODE=1`, retorna Response 403; caso contrário `null`. */
export function wishViewOnlyModeRejectIfEnabledAsNextResponseV1(
  env: NodeJS.ProcessEnv = process.env,
): NextResponse<WishViewOnlyModeJsonErrorBodyV1> | null {
  if (!wishViewOnlyModeReadServerEnvFlagV1(env)) return null;
  return NextResponse.json(wishViewOnlyModeBuildJsonErrorBodyV1(), { status: 403 });
}
