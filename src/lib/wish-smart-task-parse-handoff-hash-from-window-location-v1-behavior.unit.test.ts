import { describe, expect, it } from "vitest";
import {
  extractWishSmartTaskStHandoffPayloadRawFromHashAndSearchStringV1,
  parseWishSmartTaskHandoffHashFromWindowLocationV1,
} from "@/lib/wish-smart-task-parse-handoff-hash-from-window-location-v1";

const minimalTask = {
  id: "handoff-1",
  title: "Da SmartTask",
  description: "",
  due_date: null,
  priority: 3,
  tags: [],
  subtasks: [],
  status: "active" as const,
  focus_of_day: false,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
  archived_at: null,
};

describe("parseWishSmartTaskHandoffHashFromWindowLocationV1", () => {
  it("aceita #st-handoff com Base64URL de JSON array com uma task", () => {
    const json = JSON.stringify([minimalTask]);
    const payload = Buffer.from(json, "utf8").toString("base64url");
    const hash = `#st-handoff=${payload}`;
    const r = parseWishSmartTaskHandoffHashFromWindowLocationV1(hash);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tasks).toHaveLength(1);
    expect(r.tasks[0]!.id).toBe("handoff-1");
    expect(r.tasks[0]!.title).toBe("Da SmartTask");
  });

  it("aceita hash sem prefixo #", () => {
    const json = JSON.stringify([minimalTask]);
    const payload = Buffer.from(json, "utf8").toString("base64url");
    const r = parseWishSmartTaskHandoffHashFromWindowLocationV1(`st-handoff=${payload}`);
    expect(r.ok).toBe(true);
  });

  it("falha sem st-handoff", () => {
    const r = parseWishSmartTaskHandoffHashFromWindowLocationV1("#other=x");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toMatch(/st-handoff/i);
  });

  it("falha com payload Base64 inválido", () => {
    const r = parseWishSmartTaskHandoffHashFromWindowLocationV1("#st-handoff=!!!");
    expect(r.ok).toBe(false);
  });

  it("aceita st-handoff na query string (?st-handoff=)", () => {
    const json = JSON.stringify([minimalTask]);
    const payload = Buffer.from(json, "utf8").toString("base64url");
    const r = parseWishSmartTaskHandoffHashFromWindowLocationV1("", `?st-handoff=${payload}`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tasks).toHaveLength(1);
  });

  it("extrai o segmento st-handoff=... sem passar por URLSearchParams (evita corromper payload)", () => {
    const rawPayload = "QUFBQStCQkJCL0NDQ0M=";
    const hash = `#st-handoff=${rawPayload}`;
    expect(extractWishSmartTaskStHandoffPayloadRawFromHashAndSearchStringV1(hash, "")).toBe(rawPayload);
  });
});
