import { NextResponse } from "next/server";

/**
 * Proxy para `GET <BASE>/api/integrations/v1/snapshot` do SmartTask (evita expor a API key no browser).
 * Env: `SMARTTASK_SNAPSHOT_BASE_URL`, `SMARTTASK_INTEGRATION_API_KEY`.
 */
export async function GET() {
  const base = process.env.SMARTTASK_SNAPSHOT_BASE_URL?.trim();
  const token = process.env.SMARTTASK_INTEGRATION_API_KEY?.trim();
  if (!base || !token) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Snapshot SmartTask não configurado no servidor. Defina `SMARTTASK_SNAPSHOT_BASE_URL` e `SMARTTASK_INTEGRATION_API_KEY`.",
      },
      { status: 503 },
    );
  }

  const url = `${base.replace(/\/+$/, "")}/api/integrations/v1/snapshot`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const text = await res.text();

    if (res.status === 404) {
      return NextResponse.json(
        { ok: false, message: "Ainda não há snapshot publicado no servidor SmartTask (404)." },
        { status: 404 },
      );
    }
    if (res.status === 401) {
      return NextResponse.json({ ok: false, message: "Credenciais inválidas para o snapshot (401)." }, { status: 401 });
    }
    if (res.status === 503) {
      return NextResponse.json({ ok: false, message: "Integração indisponível no servidor (503)." }, { status: 503 });
    }
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: `Falha ao buscar snapshot (HTTP ${res.status}).` },
        { status: 502 },
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Falha de rede ao buscar snapshot." },
      { status: 502 },
    );
  }
}
