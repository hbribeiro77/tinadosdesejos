/**
 * Sobe `next dev` com o MESMO `process.execPath` que recompila o better-sqlite3.
 * No Windows, `npm run dev` → `next.cmd` pode usar outro Node do PATH (causa ERR_DLOPEN_FAILED).
 */
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const nodeExe = process.execPath;
const nodeBinDir = path.dirname(nodeExe);
const ensureScript = path.join(projectRoot, "scripts", "ensure-better-sqlite3-native-for-current-node.mjs");
const nextBin = require.resolve("next/dist/bin/next");

const extraArgs = process.argv.slice(2);

/** Filhos do Next (Turbopack) herdam PATH; sem isso pegam outro `node` e outro better_sqlite3.node. */
const envWithNodeFirstInPath = {
  ...process.env,
  PATH: `${nodeBinDir}${path.delimiter}${process.env.PATH ?? ""}`,
};

console.log(`[dev] Node: ${process.version} (modules=${process.versions.modules})`);
console.log(`[dev] Executável: ${nodeExe}`);

const ensure = spawnSync(nodeExe, [ensureScript], {
  cwd: projectRoot,
  stdio: "inherit",
  env: envWithNodeFirstInPath,
});

if (ensure.status !== 0) {
  process.exit(ensure.status ?? 1);
}

try {
  const fs = require("node:fs");
  const path = require("node:path");
  const nextDir = path.join(projectRoot, ".next");
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("[dev] Cache .next removido após ensure:sqlite.");
  }
} catch {
  /* ignore */
}

const nextArgs = [nextBin, "dev", ...extraArgs];
const child = spawn(nodeExe, nextArgs, {
  cwd: projectRoot,
  stdio: "inherit",
  env: envWithNodeFirstInPath,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("[dev] Falha ao iniciar Next:", error);
  process.exit(1);
});
