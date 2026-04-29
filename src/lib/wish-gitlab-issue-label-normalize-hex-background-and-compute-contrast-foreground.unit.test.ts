import { describe, expect, it } from "vitest";
import {
  gitLabIssueLabelContrastForegroundFromBackgroundHex,
  normalizeGitLabIssueLabelBackgroundColor,
} from "@/lib/wish-gitlab-issue-label-normalize-hex-background-and-compute-contrast-foreground";

describe("normalizeGitLabIssueLabelBackgroundColor", () => {
  it("aceita #RRGGBB", () => {
    expect(normalizeGitLabIssueLabelBackgroundColor("#FF6B00")).toBe("#ff6b00");
  });

  it("adiciona # em RRGGBB sem hash", () => {
    expect(normalizeGitLabIssueLabelBackgroundColor("8F4BFF")).toBe("#8f4bff");
  });

  it("expande #RGB", () => {
    expect(normalizeGitLabIssueLabelBackgroundColor("#f0a")).toBe("#ff00aa");
  });

  it("retorna null para vazio ou inválido", () => {
    expect(normalizeGitLabIssueLabelBackgroundColor(null)).toBeNull();
    expect(normalizeGitLabIssueLabelBackgroundColor("")).toBeNull();
    expect(normalizeGitLabIssueLabelBackgroundColor("nope")).toBeNull();
  });
});

describe("gitLabIssueLabelContrastForegroundFromBackgroundHex", () => {
  it("fundo claro → texto escuro", () => {
    const fg = gitLabIssueLabelContrastForegroundFromBackgroundHex("#ffeecc");
    expect(fg).toBe("#0f172a");
  });

  it("fundo escuro → texto claro", () => {
    const fg = gitLabIssueLabelContrastForegroundFromBackgroundHex("#1a1a2e");
    expect(fg).toBe("#fafafa");
  });

  it("aceita rgb() (mock GitLab)", () => {
    const fgLightBg = gitLabIssueLabelContrastForegroundFromBackgroundHex("rgb(230, 240, 250)");
    expect(fgLightBg).toBe("#0f172a");
    const fgBlue = gitLabIssueLabelContrastForegroundFromBackgroundHex("rgb(108, 163, 255)");
    expect(["#0f172a", "#fafafa"]).toContain(fgBlue);
  });
});

describe("normalizeGitLabIssueLabelBackgroundColor rgb", () => {
  it("mantém rgb() válido para CSS", () => {
    expect(normalizeGitLabIssueLabelBackgroundColor("rgb(108, 163, 255)")).toBe("rgb(108, 163, 255)");
  });
});
