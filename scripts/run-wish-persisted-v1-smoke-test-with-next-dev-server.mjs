/**
 * Smoke real: mesmo Node do npm, rebuild sqlite, next dev, APIs 200 + JSON ok.
 */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const port = process.env.SMOKE_DEV_PORT ?? "3010";
const baseUrl = `http://127.0.0.1:${port}`;
/** Nunca usar `data/triage.db` do dev — smoke grava quadro de teste via PUT. */
const smokeSqlitePath = path.join(projectRoot, "data", "smoke-triage.db");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false,
      ...options,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exit ${code}`));
    });
  });
}

function tryFreeTcpPortOnWindows(portNumber) {
  if (process.platform !== "win32") return;
  try {
    const out = execSync(`netstat -ano | findstr :${portNumber}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const m = line.trim().match(/\s+(\d+)\s*$/);
      if (m?.[1]) pids.add(m[1]);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" });
        console.log(`[smoke:full] Encerrado PID ${pid} (porta ${portNumber}).`);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* porta livre */
  }
}

async function waitForHealth(maxMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
      if (res.ok) return;
    } catch {
      /* aguardando */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Timeout aguardando ${baseUrl}/api/health`);
}

async function assertPersistedBoardApiWorks() {
  const getRes = await fetch(`${baseUrl}/api/wish-kanban-board/persisted-v1`, { cache: "no-store" });
  const getText = await getRes.text();
  if (getRes.status === 404) {
    throw new Error(
      "GET /api/wish-kanban-board/persisted-v1 retornou 404 — servidor desatualizado ou rota ausente. Reinicie `npm run dev`.",
    );
  }
  if (getRes.status >= 500) {
    throw new Error(
      `GET /api/wish-kanban-board/persisted-v1 retornou ${getRes.status}. Corpo: ${getText.slice(0, 400)}`,
    );
  }
  let getJson;
  try {
    getJson = JSON.parse(getText);
  } catch {
    throw new Error(`GET persisted-v1 não retornou JSON válido (HTTP ${getRes.status}).`);
  }
  if (getJson.ok !== true) {
    throw new Error(`GET persisted-v1 JSON ok!==true: ${getText.slice(0, 400)}`);
  }

  const putRes = await fetch(`${baseUrl}/api/wish-kanban-board/persisted-v1`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      board: {
        id: "smoke-full-board",
        title: "Smoke full (teste automatizado)",
        columnOrder: ["col-1"],
        columnsById: { "col-1": { id: "col-1", title: "Backlog", cardIds: [] } },
        cardsById: {},
      },
    }),
  });
  const putText = await putRes.text();
  if (!putRes.ok) {
    throw new Error(`PUT persisted-v1 HTTP ${putRes.status}: ${putText.slice(0, 400)}`);
  }
  const putJson = JSON.parse(putText);
  if (putJson.ok !== true) {
    throw new Error(`PUT persisted-v1 falhou: ${putText.slice(0, 400)}`);
  }

  if (devLogIncludesSqliteNativeError()) {
    throw new Error(
      "Log do next dev contém ERR_DLOPEN_FAILED / NODE_MODULE_VERSION — better-sqlite3 incompatível com o Node do `npm run dev`.",
    );
  }
}

let devLog = "";

function devLogIncludesSqliteNativeError() {
  return /ERR_DLOPEN_FAILED|NODE_MODULE_VERSION|better_sqlite3\.node/i.test(devLog);
}

async function main() {
  console.log(`[smoke:full] Node do runner: ${process.version} (${process.execPath})`);
  console.log(`[smoke:full] Liberando portas 3000 e ${port}...`);
  tryFreeTcpPortOnWindows("3000");
  tryFreeTcpPortOnWindows(port);

  console.log("[smoke:full] Garantindo better-sqlite3 para este Node...");
  const ensureScript = path.join(projectRoot, "scripts", "ensure-better-sqlite3-native-for-current-node.mjs");
  await run(process.execPath, [ensureScript]);

  try {
    const smokeDataDir = path.dirname(smokeSqlitePath);
    if (!fs.existsSync(smokeDataDir)) fs.mkdirSync(smokeDataDir, { recursive: true });
    if (fs.existsSync(smokeSqlitePath)) fs.unlinkSync(smokeSqlitePath);
    console.log(`[smoke:full] SQLite isolado: ${smokeSqlitePath}`);
  } catch (error) {
    console.warn(
      "[smoke:full] Não foi possível resetar smoke-triage.db:",
      error instanceof Error ? error.message : error,
    );
  }

  try {
    const nextDir = path.join(projectRoot, ".next");
    if (fs.existsSync(nextDir)) fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("[smoke:full] Cache .next removido.");
  } catch (error) {
    console.warn("[smoke:full] Falha ao limpar .next:", error instanceof Error ? error.message : error);
  }

  console.log(`[smoke:full] Subindo next dev na porta ${port} (mesmo Node: ${process.execPath})...`);
  const nodeBinDir = path.dirname(process.execPath);
  const envWithNodeFirstInPath = {
    ...process.env,
    PATH: `${nodeBinDir}${path.delimiter}${process.env.PATH ?? ""}`,
    WISH_SQLITE_DATABASE_PATH: smokeSqlitePath,
  };
  const devScript = path.join(projectRoot, "scripts", "run-next-dev-with-ensure-sqlite-same-node.mjs");
  const dev = spawn(process.execPath, [devScript, "-p", port], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: envWithNodeFirstInPath,
    shell: false,
  });

  dev.stdout?.on("data", (chunk) => {
    devLog += chunk.toString();
    process.stdout.write(chunk);
  });
  dev.stderr?.on("data", (chunk) => {
    devLog += chunk.toString();
    process.stderr.write(chunk);
  });

  const killDev = () => {
    if (!dev.killed) {
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", String(dev.pid), "/f", "/t"], { shell: true });
        } else {
          dev.kill("SIGTERM");
        }
      } catch {
        /* ignore */
      }
    }
  };

  process.on("SIGINT", () => {
    killDev();
    process.exit(130);
  });

  try {
    await waitForHealth();
    console.log("[smoke:full] Verificando APIs de persistência (mesmo caminho do browser)...");
    await assertPersistedBoardApiWorks();

    console.log("[smoke:full] Rodando vitest smoke...");
    await new Promise((resolve, reject) => {
      const vitest = spawn("npx", ["vitest", "run", "--config", "vitest.smoke.config.ts"], {
        cwd: projectRoot,
        stdio: "inherit",
        shell: true,
        env: {
          ...process.env,
          SMOKE_BASE_URL: baseUrl,
          SMOKE_REQUIRE_HTTP: "1",
          SMOKE_ALLOW_DESTRUCTIVE_HTTP_PUT: "1",
          SMOKE_SKIP_SQLITE: "1",
        },
      });
      vitest.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`vitest smoke exit ${code}`));
      });
    });

    console.log("[smoke:full] OK — app sobe e persistência HTTP funciona.");
  } catch (error) {
    console.error("[smoke:full] FALHOU:", error instanceof Error ? error.message : error);
    if (devLog) {
      console.error("--- trecho do log next dev ---");
      console.error(devLog.slice(-5000));
    }
    process.exitCode = 1;
  } finally {
    killDev();
  }
}

main();
