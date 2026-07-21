import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import type { WishKanbanBoardExportBundleParsedV1 } from "@/lib/wish-kanban-board-export-bundle-with-description-uploaded-assets-v1-types";
import { wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-is-valid-for-serve-v1";

function readAssetsMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [fileName, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1(fileName)) continue;
    if (typeof value !== "string" || !value.trim()) continue;
    out[fileName] = value.trim();
  }
  return out;
}

/** Aceita `{ version: 1, board }` ou `{ version: 2, board, descriptionUploadedAssetsBase64ByFileNameV1 }`. */
export function wishKanbanBoardParseExportBundleJsonTextAcceptVersion1Or2WithOptionalAssetsV1(
  text: string,
): WishKanbanBoardExportBundleParsedV1 | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const version = (parsed as { version?: unknown }).version;
    if (version !== 1 && version !== 2) return null;
    const board = (parsed as { board?: unknown }).board;
    if (!board || typeof board !== "object") return null;

    const assetsRaw =
      version === 2
        ? (parsed as { descriptionUploadedAssetsBase64ByFileNameV1?: unknown })
            .descriptionUploadedAssetsBase64ByFileNameV1
        : undefined;

    return {
      board: board as WishKanbanBoard,
      descriptionUploadedAssetsBase64ByFileNameV1: readAssetsMap(assetsRaw),
    };
  } catch {
    return null;
  }
}
