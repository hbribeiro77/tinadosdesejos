import { z } from "zod";

const score = z.number().int().min(1).max(5);

export const gitlabApplyGutScoringRequestBodySchema = z.object({
  issueUrl: z.string().trim().min(1),
  g: score,
  u: score,
  t: score,
});

export type GitlabApplyGutScoringRequestBody = z.infer<typeof gitlabApplyGutScoringRequestBodySchema>;
