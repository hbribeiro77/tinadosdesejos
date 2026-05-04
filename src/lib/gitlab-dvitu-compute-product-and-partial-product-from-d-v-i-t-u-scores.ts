import type { GitlabDvituAxisKey } from "@/lib/gitlab-dvitu-matrix-criteria-descriptions-by-axis-and-score-one-to-five-pt-br-v1";

export type GitlabDvituScoresDvitU = Record<GitlabDvituAxisKey, number | null>;

/** Produto D×V×I×T×U (todos entre 1 e 5). */
export function gitlabDvituComputeProductFromDvitUScores(scores: {
  d: number;
  v: number;
  i: number;
  t: number;
  u: number;
}): number {
  return scores.d * scores.v * scores.i * scores.t * scores.u;
}

/**
 * Produto dos fatores já escolhidos (1–5); ignora `null`.
 * Retorna `null` se nenhum fator definido.
 */
export function gitlabDvituComputePartialProductFromOptionalScores(scores: GitlabDvituScoresDvitU): number | null {
  const factors: number[] = [];
  (["d", "v", "i", "t", "u"] as const).forEach((k) => {
    const v = scores[k];
    if (v != null && v >= 1 && v <= 5) factors.push(v);
  });
  if (factors.length === 0) return null;
  return factors.reduce((a, b) => a * b, 1);
}
