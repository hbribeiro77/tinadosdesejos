/**
 * Garante better-sqlite3 compilado para o MESMO NODE_MODULE_VERSION deste process.execPath.
 * Recompila se o marcador em node_modules não bater (ex.: Vitest Node 22 vs terminal Node 20).
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const projectRoot = process.cwd();
const betterSqlite3Dir = path.join(projectRoot, "node_modules", "better-sqlite3");
const buildMarkerPath = path.join(betterSqlite3Dir, ".tinadosdesejos-built-for-node-modules.txt");
const currentModules = process.versions.modules;

function readBuiltForModulesMarker() {
  try {
    return fs.readFileSync(buildMarkerPath, "utf8").trim();
  } catch {
    return null;
  }
}

function writeBuiltForModulesMarker() {
  fs.writeFileSync(buildMarkerPath, `${currentModules}\n`, "utf8");
}

function removeBetterSqlite3NativeBuildArtifacts() {
  const releaseDir = path.join(betterSqlite3Dir, "build", "Release");
  if (!fs.existsSync(releaseDir)) return;
  for (const name of fs.readdirSync(releaseDir)) {
    if (name.endsWith(".node")) {
      try {
        fs.unlinkSync(path.join(releaseDir, name));
      } catch {
        /* pode estar bloqueado — rebuild vai falhar com mensagem clara */
      }
    }
  }
}

function tryLoadBetterSqlite3() {
  try {
    require("better-sqlite3");
    return null;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

function rebuildBetterSqlite3() {
  console.log(
    `[sqlite] Recompilando better-sqlite3 para Node ${process.version} (modules=${currentModules}, ${process.execPath})...`,
  );
  let result;
  try {
    const npmCli = require.resolve("npm/bin/npm-cli.js");
    result = spawnSync(process.execPath, [npmCli, "rebuild", "better-sqlite3"], {
      stdio: "inherit",
      env: process.env,
      cwd: projectRoot,
    });
  } catch {
    result = spawnSync("npm", ["rebuild", "better-sqlite3"], {
      stdio: "inherit",
      shell: true,
      env: process.env,
      cwd: projectRoot,
    });
  }
  if (result.status !== 0) {
    return new Error(`npm rebuild better-sqlite3 falhou (código ${result.status ?? "?"}).`);
  }
  return null;
}

function needsRebuildBecauseNodeModulesChanged() {
  const marker = readBuiltForModulesMarker();
  return marker !== currentModules;
}

let loadError = tryLoadBetterSqlite3();

if (!loadError && needsRebuildBecauseNodeModulesChanged()) {
  console.warn(
    `[sqlite] Binário foi compilado para NODE_MODULE_VERSION ${readBuiltForModulesMarker()} mas este Node é ${currentModules}. Recompilando...`,
  );
  removeBetterSqlite3NativeBuildArtifacts();
  loadError = new Error("stale native build");
}

if (!loadError) {
  console.log(`[sqlite] better-sqlite3 OK (Node ${process.version}, modules=${currentModules}).`);
  writeBuiltForModulesMarker();
  process.exit(0);
}

console.warn(`[sqlite] better-sqlite3 não carregou: ${loadError.message}`);

if (needsRebuildBecauseNodeModulesChanged() || loadError.message.includes("NODE_MODULE_VERSION")) {
  removeBetterSqlite3NativeBuildArtifacts();
}

const rebuildError = rebuildBetterSqlite3();
if (rebuildError) {
  console.error(`[sqlite] ${rebuildError.message}`);
  console.error("[sqlite] Pare todos os `npm run dev`, feche o terminal/IDE que segura o .node e rode de novo.");
  process.exit(1);
}

const secondError = tryLoadBetterSqlite3();
if (secondError) {
  console.error(`[sqlite] Ainda não carrega após rebuild: ${secondError.message}`);
  console.error(`[sqlite] Node atual: ${process.version} modules=${currentModules}`);
  console.error(`[sqlite] Executável: ${process.execPath}`);
  process.exit(1);
}

writeBuiltForModulesMarker();
console.log(`[sqlite] better-sqlite3 OK após rebuild (Node ${process.version}, modules=${currentModules}).`);
