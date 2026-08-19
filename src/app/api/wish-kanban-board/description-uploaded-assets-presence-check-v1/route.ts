import { access } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1 } from "@/lib/mirror-gitlab-issue-description-upload-assets-to-local-data-directory-and-rewrite-markdown-on-server-v1";
import { wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-is-valid-for-serve-v1";
import { wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1 } from "@/lib/wish-view-only-board-import-reject-unauthorized-put-as-next-response-v1";

const bodySchema = z.object({
  fileNames: z.array(z.string()).max(500),
});

/**
 * Informa quais assets espelhados já existem em `data/` (usado pelo publish do editor).
 * Em view-only exige Bearer da chave de import (mesmo guard do PUT).
 */
export async function POST(request: Request) {
  const importUnauthorized = wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1(request);
  if (importUnauthorized) return importUnauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_json", message: "Body JSON inválido." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "invalid_body", message: "Informe `fileNames` (array)." },
      { status: 400 },
    );
  }

  const dataDir = wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1();
  const presentFileNames: string[] = [];
  const missingFileNames: string[] = [];
  const invalidFileNames: string[] = [];

  for (const fileName of parsed.data.fileNames) {
    if (!wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1(fileName)) {
      invalidFileNames.push(fileName);
      continue;
    }
    try {
      await access(path.join(dataDir, fileName));
      presentFileNames.push(fileName);
    } catch {
      missingFileNames.push(fileName);
    }
  }

  return NextResponse.json({
    ok: true,
    presentFileNames,
    missingFileNames,
    invalidFileNames,
  });
}
