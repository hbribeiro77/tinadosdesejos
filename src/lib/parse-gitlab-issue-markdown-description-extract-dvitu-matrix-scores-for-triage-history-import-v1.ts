import { gitlabDvituComputeProductFromDvitUScores } from "@/lib/gitlab-dvitu-compute-product-and-partial-product-from-d-v-i-t-u-scores";
import {
  GITLAB_DVITU_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1,
  type GitlabDvituAxisKey,
} from "@/lib/gitlab-dvitu-matrix-criteria-descriptions-by-axis-and-score-one-to-five-pt-br-v1";

export type ParsedDvituMatrixForTriageHistoryImportV1 =
  | {
      ok: true;
      scores: Record<GitlabDvituAxisKey, 1 | 2 | 3 | 4 | 5>;
      explanations: Partial<Record<GitlabDvituAxisKey, string>>;
      performedAt: Date | null;
      /** Valor na linha Total, se existir (para conferência). */
      productFromTotalRow: number | null;
      /** Texto se o produto calculado não bater com a linha Total. */
      productMismatchHint: string | null;
    }
  | { ok: false; message: string };

/** Divide uma linha de tabela Markdown por `|`, respeitando `\|`. */
export function splitGitlabIssueMarkdownTablePipeRowIntoCells(line: string): string[] {
  let s = line.trim();
  if (!s.startsWith("|")) return [];
  s = s.replace(/^\|/, "").replace(/\|\s*$/, "");
  const out: string[] = [];
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") {
      buf += "|";
      i++;
      continue;
    }
    if (s[i] === "|") {
      out.push(buf.trim());
      buf = "";
      continue;
    }
    buf += s[i];
  }
  out.push(buf.trim());
  return out;
}

function stripMarkdownBold(cell: string): string {
  return cell.replace(/\*{1,2}/g, "").trim();
}

function normalizeCellForAxisMatch(cell: string): string {
  return stripMarkdownBold(cell).replace(/\s+/g, " ").trim().toLowerCase();
}

/** Extrai o dígito 1–5 que inicia a coluna “Nota” (aceita `4 —`, `4-`, `4–`). */
export function parseDvituMatrixNotaCellLeadingScore(cell: string): 1 | 2 | 3 | 4 | 5 | null {
  const t = stripMarkdownBold(cell).trim();
  const m = t.match(/^(\d)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 1 || n > 5) return null;
  return n as 1 | 2 | 3 | 4 | 5;
}

function extractDetailsBlockPreferringDvitu(description: string): string {
  const re = /<details[^>]*>[\s\S]*?<\/details>/gi;
  let m: RegExpExecArray | null;
  let candidate = "";
  while ((m = re.exec(description)) !== null) {
    if (/matriz\s+dvitu/i.test(m[0])) candidate = m[0];
  }
  if (candidate) return candidate;
  return description;
}

function parsePerformedAtFromDetailsBlock(block: string): Date | null {
  const sm = block.match(
    /<summary[^>]*>\s*Matriz\s+DVITU\s+realizada\s+em\s+([^<]+)<\/summary>/i,
  );
  if (!sm) return null;
  const raw = sm[1]
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  return parsePtBrShortDateTimeFromDvituSummaryLine(raw);
}

/** Formato típico: `15/09/2025, 17:36` (igual `toLocaleString` curto). */
function parsePtBrShortDateTimeFromDvituSummaryLine(s: string): Date | null {
  const t = s.trim();
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2}))?$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const y = Number(m[3]);
  const hh = m[4] !== undefined ? Number(m[4]) : 12;
  const mm = m[5] !== undefined ? Number(m[5]) : 0;
  const dt = new Date(y, mo, d, hh, mm, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function isSeparatorTableLine(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("|")) return false;
  const inner = t.replace(/^\|/, "").replace(/\|\s*$/, "");
  return /^[\s|\-:|]+$/.test(inner);
}

function rowLooksLikeDataRow(cells: string[]): boolean {
  if (cells.length < 2) return false;
  const h0 = normalizeCellForAxisMatch(cells[0] ?? "");
  if (h0.includes("matriz") && h0.includes("nota")) return false;
  return true;
}

/**
 * Lê a tabela DVITU anexa na descrição (bloco &lt;details&gt; ou tabela solta no Markdown).
 */
export function parseGitlabIssueMarkdownDescriptionExtractDvituMatrixScoresForTriageHistoryImportV1(
  description: string,
): ParsedDvituMatrixForTriageHistoryImportV1 {
  if (typeof description !== "string" || !description.trim()) {
    return { ok: false, message: "Descrição da issue vazia." };
  }

  const block = extractDetailsBlockPreferringDvitu(description);
  const performedAt = parsePerformedAtFromDetailsBlock(block);

  const lines = block.split(/\r?\n/);
  let inTable = false;
  const dataRows: string[][] = [];
  let productFromTotalRowParsed: number | null = null;

  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;

    if (/^\|\s*Matriz\s+DVITU\s*\|\s*Nota/i.test(t)) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (isSeparatorTableLine(t)) continue;

    const cells = splitGitlabIssueMarkdownTablePipeRowIntoCells(t);
    if (!rowLooksLikeDataRow(cells)) continue;

    const first = normalizeCellForAxisMatch(cells[0] ?? "");
    if (first.includes("total")) {
      const totalCell = cells[1] ?? "";
      const pm = stripMarkdownBold(totalCell).match(/\[DVITU:\s*(\d+)\s*\]/i);
      if (pm?.[1]) {
        const n = Number.parseInt(pm[1], 10);
        if (Number.isFinite(n)) productFromTotalRowParsed = n;
      }
      break;
    }

    dataRows.push(cells);
  }

  if (dataRows.length === 0) {
    return {
      ok: false,
      message:
        "Não encontrei uma tabela ‘Matriz DVITU’ na descrição. Confirme se a issue tem o bloco colapsável com a matriz (ou o mesmo Markdown).",
    };
  }

  const scores: Partial<Record<GitlabDvituAxisKey, 1 | 2 | 3 | 4 | 5>> = {};
  const explanations: Partial<Record<GitlabDvituAxisKey, string>> = {};

  for (const def of GITLAB_DVITU_AXIS_DEFINITIONS_ORDERED_FOR_TABLE_PT_BR_V1) {
    const labelNeedle = def.tableRowLabel.toLowerCase();
    const row = dataRows.find((cells) => {
      const a0 = normalizeCellForAxisMatch(cells[0] ?? "");
      return (
        a0 === labelNeedle ||
        a0.startsWith(`${labelNeedle} `) ||
        a0.startsWith(`${labelNeedle}(`)
      );
    });
    if (!row) {
      return {
        ok: false,
        message: `Falta a linha do eixo “${def.tableRowLabel}” na tabela DVITU.`,
      };
    }
    const notaCell = row[1] ?? "";
    const sc = parseDvituMatrixNotaCellLeadingScore(notaCell);
    if (sc === null) {
      return {
        ok: false,
        message: `Não consegui ler a nota (1–5) na linha “${def.tableRowLabel}”. Conteúdo: ${notaCell.slice(0, 80)}…`,
      };
    }
    scores[def.key] = sc;
    if (row.length >= 3) {
      const x = stripMarkdownBold(row[2] ?? "").trim();
      if (x && x !== "—" && x !== "-") {
        explanations[def.key] = x;
      }
    }
  }

  const fullScores = scores as Record<GitlabDvituAxisKey, 1 | 2 | 3 | 4 | 5>;
  const computed = gitlabDvituComputeProductFromDvitUScores({
    d: fullScores.d,
    v: fullScores.v,
    i: fullScores.i,
    t: fullScores.t,
    u: fullScores.u,
  });

  let productMismatchHint: string | null = null;
  if (
    productFromTotalRowParsed !== null &&
    productFromTotalRowParsed !== computed
  ) {
    productMismatchHint = `O total na tabela ([DVITU: ${productFromTotalRowParsed}]) difere do produto calculado (${computed}); os scores foram importados mesmo assim.`;
  }

  return {
    ok: true,
    scores: fullScores,
    explanations,
    performedAt,
    productFromTotalRow: productFromTotalRowParsed,
    productMismatchHint,
  };
}
