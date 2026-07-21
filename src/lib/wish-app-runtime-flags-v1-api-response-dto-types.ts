export type WishAppRuntimeFlagsV1GetResponseDto =
  | { ok: true; viewOnlyMode: boolean; boardImportRequiresApiKey: boolean }
  | { ok: false; message: string };
