import { z } from "zod";

export const pullRequestDetailSchema = z.object({
  draft: z.boolean(),
  mergeable: z.boolean().nullable(),
  head: z.object({ sha: z.string().min(1) }),
  requested_reviewers: z
    .array(z.object({ login: z.string() }))
    .optional()
    .default([]),
  requested_teams: z
    .array(z.object({ slug: z.string() }))
    .optional()
    .default([]),
});

export const pullRequestReviewSchema = z.object({
  id: z.number(),
  user: z.object({ login: z.string() }).nullable(),
  state: z.string(),
  submitted_at: z.string().nullable().optional(),
});

export const checkRunsSchema = z.object({
  check_runs: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      html_url: z.url(),
      status: z.string(),
      conclusion: z.string().nullable(),
    }),
  ),
});
