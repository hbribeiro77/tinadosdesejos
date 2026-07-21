import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1 } from "@/lib/mirror-gitlab-issue-description-upload-assets-to-local-data-directory-and-rewrite-markdown-on-server-v1";
import { wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-is-valid-for-serve-v1";

const MAX_ASSET_BYTES_V1 = 12 * 1024 * 1024;
const MAX_ASSET_COUNT_V1 = 250;

export type WishKanbanBoardWriteDescriptionUploadedAssetsResultV1 = {
  writtenFileNames: string[];
  skippedInvalidFileNames: string[];
};

export async function wishKanbanBoardWriteDescriptionUploadedAssetsBase64MapToLocalDataDirectoryOnServerV1(
  assetsBase64ByFileName: Record<string, string>,
  options?: { dataDirectoryAbsolutePath?: string },
): Promise<WishKanbanBoardWriteDescriptionUploadedAssetsResultV1> {
  const entries = Object.entries(assetsBase64ByFileName);
  if (entries.length > MAX_ASSET_COUNT_V1) {
    throw new Error(`Muitos assets no import (máx. ${MAX_ASSET_COUNT_V1}).`);
  }

  const dataDir =
    options?.dataDirectoryAbsolutePath ?? wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1();
  await mkdir(dataDir, { recursive: true });

  const writtenFileNames: string[] = [];
  const skippedInvalidFileNames: string[] = [];

  for (const [fileName, base64] of entries) {
    if (!wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1(fileName)) {
      skippedInvalidFileNames.push(fileName);
      continue;
    }
    let bytes: Buffer;
    try {
      bytes = Buffer.from(base64, "base64");
    } catch {
      skippedInvalidFileNames.push(fileName);
      continue;
    }
    if (!bytes.length || bytes.length > MAX_ASSET_BYTES_V1) {
      skippedInvalidFileNames.push(fileName);
      continue;
    }
    await writeFile(path.join(dataDir, fileName), bytes);
    writtenFileNames.push(fileName);
  }

  return { writtenFileNames, skippedInvalidFileNames };
}
