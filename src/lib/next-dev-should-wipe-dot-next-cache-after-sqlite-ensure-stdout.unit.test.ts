import { describe, expect, it } from "vitest";
import { nextDevShouldWipeDotNextCacheAfterSqliteEnsureStdout } from "../../scripts/next-dev-should-wipe-dot-next-cache-after-sqlite-ensure-stdout.mjs";

describe("nextDevShouldWipeDotNextCacheAfterSqliteEnsureStdout", () => {
  it("não apaga .next quando o sqlite já carregou sem rebuild", () => {
    const stdout =
      "[sqlite] better-sqlite3 OK (Node v22.14.0, modules=127).\n";
    expect(nextDevShouldWipeDotNextCacheAfterSqliteEnsureStdout(stdout)).toBe(
      false,
    );
  });

  it("apaga .next só quando o ensure sinaliza rebuild nativo", () => {
    const stdout = [
      "[sqlite] better-sqlite3 OK após rebuild (Node v22.14.0, modules=127).",
      "[sqlite] native-rebuild-happened=yes",
      "",
    ].join("\n");
    expect(nextDevShouldWipeDotNextCacheAfterSqliteEnsureStdout(stdout)).toBe(
      true,
    );
  });
});
