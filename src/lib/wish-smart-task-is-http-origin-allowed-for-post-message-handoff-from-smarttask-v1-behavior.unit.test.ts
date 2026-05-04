import { describe, expect, it } from "vitest";
import { wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1 } from "@/lib/wish-smart-task-is-http-origin-allowed-for-post-message-handoff-from-smarttask-v1";

describe("wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1", () => {
  const key = "NEXT_PUBLIC_SMARTTASK_HANDOFF_ALLOWED_ORIGINS";

  it("com env vazio aceita localhost:3000 e 127.0.0.1:3000", () => {
    const prev = process.env[key];
    delete process.env[key];
    expect(wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1("http://localhost:3000")).toBe(
      true,
    );
    expect(wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1("http://127.0.0.1:3000")).toBe(true);
    expect(wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1("http://evil.test")).toBe(false);
    if (prev !== undefined) process.env[key] = prev;
  });

  it("com env definido usa só essa lista", () => {
    const prev = process.env[key];
    process.env[key] = "https://st.example";
    expect(wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1("https://st.example")).toBe(true);
    expect(wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1("http://localhost:3000")).toBe(
      false,
    );
    if (prev !== undefined) process.env[key] = prev;
    else delete process.env[key];
  });

  it("em NODE_ENV=development sem env aceita localhost em qualquer porta", () => {
    const prev = process.env[key];
    const prevNode = process.env.NODE_ENV;
    delete process.env[key];
    process.env.NODE_ENV = "development";
    expect(wishSmartTaskIsHttpOriginAllowedForPostMessageHandoffFromSmarttaskV1("http://localhost:5173")).toBe(
      true,
    );
    if (prev !== undefined) process.env[key] = prev;
    else delete process.env[key];
    process.env.NODE_ENV = prevNode ?? "test";
  });
});
