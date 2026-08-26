import type { z } from "zod";

import { GitHubApiError } from "@/lib/github/errors";

export function parseGitHubResponse<T>(
  schema: z.ZodType<T>,
  value: unknown,
  description: string,
): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  throw new GitHubApiError(
    "unavailable",
    `GitHub returned ${description} in an unexpected format.`,
  );
}
