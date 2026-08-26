import { z } from "zod";

export const authenticatedUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.url(),
  html_url: z.url(),
});

export const workspaceRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.url(),
  description: z.string().nullable(),
  private: z.boolean(),
  visibility: z.string().optional(),
  fork: z.boolean(),
  archived: z.boolean(),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  open_issues_count: z.number().int().nonnegative(),
  has_issues: z.boolean(),
  topics: z.array(z.string()).optional().default([]),
  default_branch: z.string(),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
  pushed_at: z.string().nullable(),
  updated_at: z.string(),
  owner: z.object({ login: z.string() }),
  permissions: z
    .object({ admin: z.boolean(), maintain: z.boolean().optional() })
    .optional(),
});

export const searchSchema = z.object({
  total_count: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.number(),
      number: z.number().int().positive(),
      title: z.string(),
      html_url: z.url(),
      repository_url: z.url(),
      state: z.string(),
      comments: z.number().int().nonnegative(),
      created_at: z.string(),
      updated_at: z.string(),
      pull_request: z.unknown().optional(),
    }),
  ),
});

export const notificationSchema = z.object({
  id: z.string(),
  reason: z.string(),
  unread: z.boolean(),
  updated_at: z.string(),
  subject: z.object({
    title: z.string(),
    url: z.url().nullable(),
    type: z.string(),
  }),
  repository: z.object({
    full_name: z.string(),
    html_url: z.url(),
  }),
});

export const workflowRunsSchema = z.object({
  workflow_runs: z.array(
    z.object({
      id: z.number(),
      name: z.string().nullable(),
      display_title: z.string(),
      html_url: z.url(),
      head_branch: z.string().nullable(),
      conclusion: z.string().nullable(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
  ),
});
