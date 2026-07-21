import { NextResponse } from "next/server";
import { wishViewOnlyModeReadServerEnvFlagV1 } from "@/lib/wish-view-only-mode-read-server-env-flag-v1";
import { wishViewOnlyBoardImportApiKeyReadFromServerEnvV1 } from "@/lib/wish-view-only-board-import-api-key-read-from-server-env-v1";
import { wishViewOnlyBoardImportAuthorizationBearerMatchesConfiguredApiKeyV1 } from "@/lib/wish-view-only-board-import-authorization-bearer-matches-configured-api-key-v1";
import { WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1 } from "@/lib/wish-view-only-board-import-unauthorized-code-constant-v1";

export type WishViewOnlyBoardImportUnauthorizedJsonBodyV1 = {
  ok: false;
  code: typeof WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1;
  message: string;
};

export { WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1 };

/**
 * Em view-only: exige Bearer com `WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY` (fail-closed se key vazia).
 * Fora de view-only: retorna `null` (PUT livre para autosave do editor).
 */
export function wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): NextResponse<WishViewOnlyBoardImportUnauthorizedJsonBodyV1> | null {
  if (!wishViewOnlyModeReadServerEnvFlagV1(env)) return null;

  const configuredKey = wishViewOnlyBoardImportApiKeyReadFromServerEnvV1(env);
  const authorization = request.headers.get("authorization");
  const ok =
    Boolean(configuredKey) &&
    wishViewOnlyBoardImportAuthorizationBearerMatchesConfiguredApiKeyV1(authorization, configuredKey);

  if (ok) return null;

  const message = !configuredKey
    ? "Modo visualização ativo, mas `WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY` não está configurada no servidor. Defina a chave para permitir Importar."
    : "Chave de importação inválida ou ausente. Envie `Authorization: Bearer <WISH_VIEW_ONLY_BOARD_IMPORT_API_KEY>`.";

  return NextResponse.json(
    {
      ok: false,
      code: WISH_VIEW_ONLY_BOARD_IMPORT_UNAUTHORIZED_CODE_V1,
      message,
    },
    { status: 403 },
  );
}
