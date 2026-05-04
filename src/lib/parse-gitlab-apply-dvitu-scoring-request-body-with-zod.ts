import { z } from "zod";

const score = z.number().int().min(1).max(5);

export const gitlabApplyDvituScoringRequestBodySchema = z.object({
  issueUrl: z.string().trim().min(1),
  d: score,
  v: score,
  i: score,
  t: score,
  u: score,
  explanationD: z.string().trim().optional(),
  explanationV: z.string().trim().optional(),
  explanationI: z.string().trim().optional(),
  explanationT: z.string().trim().optional(),
  explanationU: z.string().trim().optional(),
});

export type GitlabApplyDvituScoringRequestBody = z.infer<typeof gitlabApplyDvituScoringRequestBodySchema>;
