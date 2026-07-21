import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import { wishKanbanBoardCollectMirroredDescriptionUploadedAssetFileNamesFromBoardMarkdownV1 } from "@/lib/wish-kanban-board-collect-mirrored-description-uploaded-asset-file-names-from-board-markdown-v1";
import { wishGitlabDescriptionUploadedAssetLocalServeUrlFromFileNameV1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-from-absolute-url-v1";

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Busca no mesmo origin os assets espelhados referenciados no quadro e devolve mapa fileName→base64. */
export async function clientFetchCollectMirroredDescriptionUploadedAssetsBase64FromBoardForExportV1(
  board: WishKanbanBoard,
): Promise<Record<string, string>> {
  const fileNames = wishKanbanBoardCollectMirroredDescriptionUploadedAssetFileNamesFromBoardMarkdownV1(board);
  const out: Record<string, string> = {};

  for (const fileName of fileNames) {
    const url = wishGitlabDescriptionUploadedAssetLocalServeUrlFromFileNameV1(fileName);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const blob = await res.blob();
      out[fileName] = await blobToBase64(blob);
    } catch {
      // asset ausente no host local — export segue sem ele
    }
  }

  return out;
}
