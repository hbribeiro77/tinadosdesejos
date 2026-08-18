/**
 * PUT de import do quadro/imagens com `Authorization: Bearer …` pode passar pelo portão
 * sem cookie de `/entrar`. A rota destino ainda valida a API key (fail-closed).
 */
export function wishAppAccessGatePathAllowsBoardImportPutWithBearerWithoutSessionCookieV1(params: {
  pathname: string;
  method: string;
  authorizationHeader: string | null;
}): boolean {
  if (params.method.toUpperCase() !== "PUT") return false;
  const auth = params.authorizationHeader?.trim() ?? "";
  if (!/^Bearer\s+\S+/i.test(auth)) return false;

  return (
    params.pathname === "/api/wish-kanban-board/persisted-v1" ||
    params.pathname === "/api/wish-kanban-board/description-uploaded-assets-import-v1"
  );
}
