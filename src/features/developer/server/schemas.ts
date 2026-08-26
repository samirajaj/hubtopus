import { z } from "zod";

export const userSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.url(),
  html_url: z.url(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  blog: z.string(),
  public_repos: z.number().int().nonnegative(),
  followers: z.number().int().nonnegative(),
  following: z.number().int().nonnegative(),
  created_at: z.string(),
});

export const repositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.url(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  open_issues_count: z.number().int().nonnegative(),
  fork: z.boolean(),
  archived: z.boolean(),
  topics: z.array(z.string()).optional().default([]),
  default_branch: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string().nullable(),
});

export const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  created_at: z.string().nullable(),
  repo: z.object({ name: z.string() }),
  payload: z.record(z.string(), z.unknown()),
});

export const organizationSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.url(),
  html_url: z.url(),
  description: z.string().nullable(),
});

export const contributionSearchSchema = z.object({
  total_count: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.number(),
      number: z.number().int().positive(),
      title: z.string(),
      html_url: z.url(),
      repository_url: z.url(),
      state: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
      comments: z.number().int().nonnegative(),
      pull_request: z
        .object({
          merged_at: z.string().nullable().optional(),
        })
        .passthrough(),
    }),
  ),
});

export const communityProfileSchema = z.object({
  health_percentage: z.number().min(0).max(100),
  files: z.object({
    code_of_conduct: z.unknown().nullable().optional(),
    contributing: z.unknown().nullable().optional(),
    issue_template: z.unknown().nullable().optional(),
    pull_request_template: z.unknown().nullable().optional(),
    readme: z.unknown().nullable().optional(),
    license: z.unknown().nullable().optional(),
  }),
});

export const releaseSchema = z.object({
  id: z.number(),
  tag_name: z.string(),
  name: z.string().nullable(),
  html_url: z.url(),
  published_at: z.string().nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
});
