import { NextResponse } from "next/server";
import { z } from "zod";
import { wishViewOnlyBoardImportRejectUnauthorizedPutAsNextResponseV1 } from "@/lib/wish-view-only-board-import-reject-unauthorized-put-as-next-response-v1";
import { wishKanbanBoardWriteDescriptionUploadedAssetsBase64MapToLocalDataDirectoryOnServerV1 } from "@/lib/wish-kanban-board-write-description-uploaded-assets-base64-map-to-local-data-directory-on-server-v1";

const bodySchema = z.object({
  assetsBase64ByFileName: z.record(z.string(), z.string()),
});

export async function PUT(request: Request) {
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
      {
        ok: false,
        code: "invalid_body",
        message: parsed.error.issues.map((i) => i.message).join("; ") || "Body inválido.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await wishKanbanBoardWriteDescriptionUploadedAssetsBase64MapToLocalDataDirectoryOnServerV1(
      parsed.data.assetsBase64ByFileName,
    );
    return NextResponse.json({
      ok: true,
      writtenCount: result.writtenFileNames.length,
      skippedCount: result.skippedInvalidFileNames.length,
    });
  } catch (error) {
    console.error("description-uploaded-assets-import-v1 PUT:", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Falha ao gravar imagens espelhadas.",
      },
      { status: 500 },
    );
  }
}
