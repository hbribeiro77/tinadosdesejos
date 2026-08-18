import { readFile } from "node:fs/promises";
import path from "node:path";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import { wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1 } from "@/lib/mirror-gitlab-issue-description-upload-assets-to-local-data-directory-and-rewrite-markdown-on-server-v1";
import { wishKanbanBoardCollectMirroredDescriptionUploadedAssetFileNamesFromBoardMarkdownV1 } from "@/lib/wish-kanban-board-collect-mirrored-description-uploaded-asset-file-names-from-board-markdown-v1";
import { wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-is-valid-for-serve-v1";

/** Lê do disco local os assets referenciados no markdown do quadro (fileName → base64). */
export async function wishKanbanBoardCollectMirroredDescriptionUploadedAssetsBase64FromLocalDataDirectoryOnServerV1(
  board: WishKanbanBoard,
  options?: { dataDirectoryAbsolutePath?: string },
): Promise<{ assetsBase64ByFileName: Record<string, string>; missingFileNames: string[] }> {
  const fileNames = wishKanbanBoardCollectMirroredDescriptionUploadedAssetFileNamesFromBoardMarkdownV1(board);
  const dataDir =
    options?.dataDirectoryAbsolutePath ?? wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1();
  const assetsBase64ByFileName: Record<string, string> = {};
  const missingFileNames: string[] = [];

  for (const fileName of fileNames) {
    if (!wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1(fileName)) {
      missingFileNames.push(fileName);
      continue;
    }
    try {
      const bytes = await readFile(path.join(dataDir, fileName));
      assetsBase64ByFileName[fileName] = bytes.toString("base64");
    } catch {
      missingFileNames.push(fileName);
    }
  }

  return { assetsBase64ByFileName, missingFileNames };
}
