import type { GitlabGutAxisKey } from "@/lib/gitlab-gut-matrix-criteria-descriptions-by-axis-and-score-one-to-five-pt-br-v1";

export type GitlabGutScoresGut = Record<GitlabGutAxisKey, number | null>;

export function gitlabGutComputeProductFromGutScores(scores: { g: number; u: number; t: number }): number {
  return scores.g * scores.u * scores.t;
}

/** Produto dos fatores já escolhidos (1–5); ignora `null`. */
export function gitlabGutComputePartialProductFromOptionalScores(scores: GitlabGutScoresGut): number | null {
  const factors: number[] = [];
  (["g", "u", "t"] as const).forEach((k) => {
    const v = scores[k];
    if (v != null && v >= 1 && v <= 5) factors.push(v);
  });
  if (factors.length === 0) return null;
  return factors.reduce((a, b) => a * b, 1);
}
