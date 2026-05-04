/**
 * Extrai o nome curto e o texto explicativo entre parênteses de rótulos no formato
 * `Nome (detalhe opcional)` usados na UI das matrizes DVITU/GUT.
 */
export function splitMatrixRadioGroupLegendIntoBoldTitleAndParentheticalHintForModalUiPtBr(
  legend: string,
): { title: string; parentheticalHint: string | null } {
  const trimmed = legend.trim();
  const m = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!m) return { title: trimmed, parentheticalHint: null };
  return { title: m[1].trim(), parentheticalHint: m[2].trim() };
}
