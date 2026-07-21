import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { wishKanbanBoardWriteDescriptionUploadedAssetsBase64MapToLocalDataDirectoryOnServerV1 } from "@/lib/wish-kanban-board-write-description-uploaded-assets-base64-map-to-local-data-directory-on-server-v1";

describe("wishKanbanBoardWriteDescriptionUploadedAssetsBase64MapToLocalDataDirectoryOnServerV1", () => {
  let tmpDir = "";

  afterEach(async () => {
    // pasta temp fica; OK em CI
  });

  it("grava arquivo válido e ignora nome inválido", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "tina-assets-import-"));
    const hash = `${"d".repeat(64)}.png`;
    const result = await wishKanbanBoardWriteDescriptionUploadedAssetsBase64MapToLocalDataDirectoryOnServerV1(
      {
        [hash]: Buffer.from("png-bytes").toString("base64"),
        "evil.txt": "YWJj",
      },
      { dataDirectoryAbsolutePath: tmpDir },
    );

    expect(result.writtenFileNames).toEqual([hash]);
    expect(result.skippedInvalidFileNames).toContain("evil.txt");
    const disk = await readFile(path.join(tmpDir, hash));
    expect(disk.toString("utf8")).toBe("png-bytes");
  });
});
