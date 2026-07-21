/** Prefixo da rota que serve arquivos espelhados em `data/gitlab-description-uploaded-assets-v1/`. */
export const WISH_GITLAB_DESCRIPTION_UPLOADED_ASSET_SERVE_API_PREFIX_V1 =
  "/api/wish-kanban-board/gitlab-description-uploaded-asset-v1";

const WISH_GITLAB_DESCRIPTION_UPLOADED_ASSET_FILE_NAME_RE_V1 =
  /^[a-f0-9]{64}\.(png|jpe?g|gif|webp|svg)$/i;

export function wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1(fileName: string): boolean {
  return WISH_GITLAB_DESCRIPTION_UPLOADED_ASSET_FILE_NAME_RE_V1.test(fileName);
}
