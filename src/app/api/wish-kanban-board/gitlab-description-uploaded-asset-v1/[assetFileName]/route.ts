import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1 } from "@/lib/mirror-gitlab-issue-description-upload-assets-to-local-data-directory-and-rewrite-markdown-on-server-v1";
import { wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1 } from "@/lib/wish-gitlab-description-uploaded-asset-file-name-is-valid-for-serve-v1";

function guessContentTypeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

type RouteContext = { params: Promise<{ assetFileName: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { assetFileName } = await context.params;

  if (!wishGitlabDescriptionUploadedAssetFileNameIsValidForServeV1(assetFileName)) {
    return NextResponse.json(
      { ok: false, code: "invalid_asset_file_name", message: "Nome de arquivo inválido." },
      { status: 400 },
    );
  }

  const filePath = path.join(
    wishGitlabDescriptionUploadedAssetsDataDirectoryAbsolutePathV1(),
    assetFileName,
  );

  try {
    const body = await readFile(filePath);
    // Uint8Array: BodyInit do Next/undici não aceita Buffer tipado do Node em alguns TS.
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": guessContentTypeFromFileName(assetFileName),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, code: "asset_not_found", message: "Asset espelhado não encontrado." },
      { status: 404 },
    );
  }
}
