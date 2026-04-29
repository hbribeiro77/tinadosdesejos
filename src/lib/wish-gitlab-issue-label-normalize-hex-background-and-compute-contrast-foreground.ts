import type { CSSProperties } from "react";

/**
 * Normaliza cores retornadas pela API GitLab (`label_details[].color`).
 * GitLab costuma enviar `#RRGGBB`, mas às vezes sem `#`; aceita também `#RGB`.
 */
export function normalizeGitLabIssueLabelBackgroundColor(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toLowerCase()}`;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const h = s.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase();
  }

  /** Mock/testes e alguns proxies enviam `rgb(...)` válido para CSS — repassa como está. */
  const rgbLike = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i.exec(s);
  if (rgbLike) {
    const r = Number(rgbLike[1]);
    const g = Number(rgbLike[2]);
    const b = Number(rgbLike[3]);
    if ([r, g, b].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) return s;
  }

  return null;
}

function parseCssBackgroundColorToRgb(background: string): { r: number; g: number; b: number } | null {
  const hexRgb = parseHexToRgb(background);
  if (hexRgb) return hexRgb;
  const m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i.exec(background.trim());
  if (!m) return null;
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  if (![r, g, b].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) return null;
  return { r, g, b };
}

function parseHexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace(/^#/, "");
  if (h.length !== 6 || !/^[0-9a-fA-F]+$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Luminância relativa sRGB (WCAG), 0–1 */
function relativeLuminance(r: number, g: number, b: number): number {
  const linearize = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** Cor de texto legível sobre o fundo informado (hex `#RRGGBB` ou `rgb(...)`). */
export function gitLabIssueLabelContrastForegroundFromBackgroundHex(backgroundCssColor: string): string {
  const rgb = parseCssBackgroundColorToRgb(backgroundCssColor);
  if (!rgb) return "#0f172a";
  const L = relativeLuminance(rgb.r, rgb.g, rgb.b);
  return L > 0.55 ? "#0f172a" : "#fafafa";
}

/** Estilos inline para um “pill” de label com cor de fundo da API. */
export function wishGitlabIssueLabelColoredPillInlineStyles(backgroundCssColor: string): Pick<
  CSSProperties,
  "backgroundColor" | "color" | "borderColor"
> {
  const fg = gitLabIssueLabelContrastForegroundFromBackgroundHex(backgroundCssColor);
  const borderAlpha = fg === "#fafafa" ? "rgba(250,250,250,0.35)" : "rgba(15,23,42,0.18)";
  return {
    backgroundColor: backgroundCssColor,
    color: fg,
    borderColor: borderAlpha,
  };
}
