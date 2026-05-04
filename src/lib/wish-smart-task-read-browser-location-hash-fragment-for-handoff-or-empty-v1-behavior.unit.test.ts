import { afterEach, describe, expect, it, vi } from "vitest";
import { wishSmartTaskReadBrowserLocationHashFragmentForHandoffOrEmptyV1 } from "@/lib/wish-smart-task-read-browser-location-hash-fragment-for-handoff-or-empty-v1";

describe("wishSmartTaskReadBrowserLocationHashFragmentForHandoffOrEmptyV1", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa location.hash quando preenchido", () => {
    vi.stubGlobal("window", {
      location: { hash: "#st-handoff=abc", href: "http://localhost/x#ignored" },
    });
    expect(wishSmartTaskReadBrowserLocationHashFragmentForHandoffOrEmptyV1()).toBe("#st-handoff=abc");
  });

  it("recorre ao href quando hash vazio", () => {
    vi.stubGlobal("window", {
      location: { hash: "", href: "http://localhost:3000/#st-handoff=xyz" },
    });
    expect(wishSmartTaskReadBrowserLocationHashFragmentForHandoffOrEmptyV1()).toBe("#st-handoff=xyz");
  });
});
