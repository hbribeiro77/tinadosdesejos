import { NextResponse } from "next/server";
import type { WishAppRuntimeFlagsV1GetResponseDto } from "@/lib/wish-app-runtime-flags-v1-api-response-dto-types";
import { wishViewOnlyModeReadServerEnvFlagV1 } from "@/lib/wish-view-only-mode-read-server-env-flag-v1";

export async function GET(): Promise<NextResponse<WishAppRuntimeFlagsV1GetResponseDto>> {
  const viewOnlyMode = wishViewOnlyModeReadServerEnvFlagV1();
  return NextResponse.json({
    ok: true,
    viewOnlyMode,
    boardImportRequiresApiKey: viewOnlyMode,
  });
}
