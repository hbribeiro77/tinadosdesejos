import https from "node:https";
import { normalizeGitlabBaseUrlForServerRequestsV1 } from "@/lib/normalize-gitlab-base-url-for-server-requests-v1";

export type GitlabServerHttpGetResult =
  | { ok: true; status: number; bodyText: string }
  | { ok: false; cause: unknown };

export function normalizeGitlabBaseUrl(raw: string) {
  return normalizeGitlabBaseUrlForServerRequestsV1(raw);
}

function gitlabGetHttpsIgnoringCert(apiUrl: string, token: string): Promise<GitlabServerHttpGetResult> {
  const u = new URL(apiUrl);
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: "GET",
        headers: {
          "PRIVATE-TOKEN": token,
          "user-agent": "tinadosdesejos/gitlab-api",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          resolve({
            ok: true,
            status: res.statusCode ?? 0,
            bodyText: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", (cause) => resolve({ ok: false, cause }));
    req.end();
  });
}

function gitlabPostHttpsIgnoringCert(apiUrl: string, token: string, jsonBody: string): Promise<GitlabServerHttpGetResult> {
  const u = new URL(apiUrl);
  const payload = Buffer.from(jsonBody, "utf8");
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: "POST",
        headers: {
          "PRIVATE-TOKEN": token,
          "Content-Type": "application/json",
          "Content-Length": String(payload.length),
          "user-agent": "tinadosdesejos/gitlab-api",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          resolve({
            ok: true,
            status: res.statusCode ?? 0,
            bodyText: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", (cause) => resolve({ ok: false, cause }));
    req.write(payload);
    req.end();
  });
}

function gitlabPutHttpsIgnoringCert(apiUrl: string, token: string, jsonBody: string): Promise<GitlabServerHttpGetResult> {
  const u = new URL(apiUrl);
  const payload = Buffer.from(jsonBody, "utf8");
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: "PUT",
        headers: {
          "PRIVATE-TOKEN": token,
          "Content-Type": "application/json",
          "Content-Length": String(payload.length),
          "user-agent": "tinadosdesejos/gitlab-api",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          resolve({
            ok: true,
            status: res.statusCode ?? 0,
            bodyText: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", (cause) => resolve({ ok: false, cause }));
    req.write(payload);
    req.end();
  });
}

/** `POST` com corpo JSON; mesma política de TLS que o GET (`GITLAB_TLS_INSECURE_DEV`). */
export async function gitlabServerHttpPostJsonWithPrivateTokenAndTlsDevFlag(
  apiUrl: string,
  token: string,
  tlsInsecureDev: boolean,
  jsonBody: string,
): Promise<GitlabServerHttpGetResult> {
  if (tlsInsecureDev && apiUrl.startsWith("https:")) {
    return gitlabPostHttpsIgnoringCert(apiUrl, token, jsonBody);
  }

  try {
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "PRIVATE-TOKEN": token,
        "Content-Type": "application/json",
      },
      body: jsonBody,
      cache: "no-store",
    });
    const bodyText = await upstream.text();
    return { ok: true, status: upstream.status, bodyText };
  } catch (cause) {
    return { ok: false, cause };
  }
}

/** `PUT` com corpo JSON; mesma política de TLS que o GET (`GITLAB_TLS_INSECURE_DEV`). */
export async function gitlabServerHttpPutJsonWithPrivateTokenAndTlsDevFlag(
  apiUrl: string,
  token: string,
  tlsInsecureDev: boolean,
  jsonBody: string,
): Promise<GitlabServerHttpGetResult> {
  if (tlsInsecureDev && apiUrl.startsWith("https:")) {
    return gitlabPutHttpsIgnoringCert(apiUrl, token, jsonBody);
  }

  try {
    const upstream = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "PRIVATE-TOKEN": token,
        "Content-Type": "application/json",
      },
      body: jsonBody,
      cache: "no-store",
    });
    const bodyText = await upstream.text();
    return { ok: true, status: upstream.status, bodyText };
  } catch (cause) {
    return { ok: false, cause };
  }
}

export type GitlabServerHttpGetBufferResult =
  | { ok: true; status: number; body: Buffer; contentType: string | null }
  | { ok: false; cause: unknown };

function gitlabGetBufferHttpsIgnoringCert(apiUrl: string, token: string): Promise<GitlabServerHttpGetBufferResult> {
  const u = new URL(apiUrl);
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: "GET",
        headers: {
          "PRIVATE-TOKEN": token,
          "user-agent": "tinadosdesejos/gitlab-api",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const contentTypeHeader = res.headers["content-type"];
          const contentType =
            typeof contentTypeHeader === "string"
              ? contentTypeHeader
              : Array.isArray(contentTypeHeader)
                ? contentTypeHeader[0] ?? null
                : null;
          resolve({
            ok: true,
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks),
            contentType,
          });
        });
      },
    );
    req.on("error", (cause) => resolve({ ok: false, cause }));
    req.end();
  });
}

/** GET binário (uploads/imagens) com a mesma política TLS do GET textual. */
export async function gitlabServerHttpGetBufferWithPrivateTokenAndTlsDevFlag(
  apiUrl: string,
  token: string,
  tlsInsecureDev: boolean,
): Promise<GitlabServerHttpGetBufferResult> {
  if (tlsInsecureDev && apiUrl.startsWith("https:")) {
    return gitlabGetBufferHttpsIgnoringCert(apiUrl, token);
  }

  try {
    const upstream = await fetch(apiUrl, {
      headers: {
        "PRIVATE-TOKEN": token,
      },
      cache: "no-store",
    });
    const bytes = await upstream.arrayBuffer();
    return {
      ok: true,
      status: upstream.status,
      body: Buffer.from(bytes),
      contentType: upstream.headers.get("content-type"),
    };
  } catch (cause) {
    return { ok: false, cause };
  }
}

export async function gitlabServerHttpGetWithPrivateTokenAndTlsDevFlag(
  apiUrl: string,
  token: string,
  tlsInsecureDev: boolean,
): Promise<GitlabServerHttpGetResult> {
  if (tlsInsecureDev && apiUrl.startsWith("https:")) {
    return gitlabGetHttpsIgnoringCert(apiUrl, token);
  }

  try {
    const upstream = await fetch(apiUrl, {
      headers: {
        "PRIVATE-TOKEN": token,
      },
      cache: "no-store",
    });
    const bodyText = await upstream.text();
    return { ok: true, status: upstream.status, bodyText };
  } catch (cause) {
    return { ok: false, cause };
  }
}
