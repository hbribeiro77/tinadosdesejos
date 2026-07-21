export type WishAppRuntimeFlagsV1GetResponseDto =
  | {
      ok: true;
      viewOnlyMode: boolean;
      boardImportRequiresApiKey: boolean;
      accessGateRequired: boolean;
    }
  | { ok: false; message: string };
