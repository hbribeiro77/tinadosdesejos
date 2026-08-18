export type WishAppRuntimeFlagsV1GetResponseDto =
  | {
      ok: true;
      viewOnlyMode: boolean;
      boardImportRequiresApiKey: boolean;
      accessGateRequired: boolean;
      /** Editor local: botão Publicar na VPS disponível (env configurada). */
      productionPublishAvailable: boolean;
    }
  | { ok: false; message: string };
