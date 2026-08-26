import "server-only";

import { GitHubApiError } from "@/lib/github/errors";

const API_ROOT = "https://api.github.com";
const DEFAULT_ACCEPT = "application/vnd.github+json";

type GitHubRequestOptions = {
  token?: string;
  accept?: string;
  allowNotFound?: boolean;
  notFoundMessage?: string;
  unauthorizedMessage?: string;
  cache: "no-store" | { revalidate: number };
};

export async function requestGitHub(
  path: string,
  options: GitHubRequestOptions,
): Promise<unknown | null> {
  const headers: Record<string, string> = {
    Accept: options.accept ?? DEFAULT_ACCEPT,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Hubtopus",
  };

  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const requestOptions: RequestInit & { next?: { revalidate: number } } = {
    headers,
  };
  if (options.cache === "no-store") {
    requestOptions.cache = "no-store";
  } else {
    requestOptions.next = { revalidate: options.cache.revalidate };
  }

  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, requestOptions);
  } catch {
    throw new GitHubApiError(
      "unavailable",
      "Hubtopus could not connect to GitHub's API.",
    );
  }

  if (response.ok) {
    return response.status === 204 ? null : response.json();
  }

  if (isRateLimited(response)) {
    throw new GitHubApiError(
      "rate-limit",
      "GitHub's API rate limit has been reached.",
      getRateLimitReset(response),
    );
  }

  if (response.status === 404 && options.allowNotFound) return null;
  if (response.status === 404 && options.notFoundMessage) {
    throw new GitHubApiError("not-found", options.notFoundMessage);
  }
  if (response.status === 401 && options.unauthorizedMessage) {
    throw new GitHubApiError("unavailable", options.unauthorizedMessage);
  }

  throw new GitHubApiError(
    "unavailable",
    `GitHub returned an unexpected ${response.status} response.`,
  );
}

function isRateLimited(response: Response): boolean {
  const remaining = response.headers.get("x-ratelimit-remaining");
  const retryAfter = response.headers.get("retry-after");
  return (
    response.status === 429 ||
    (response.status === 403 && (remaining === "0" || Boolean(retryAfter)))
  );
}

function getRateLimitReset(response: Response): Date | undefined {
  const reset = response.headers.get("x-ratelimit-reset");
  if (reset) return new Date(Number(reset) * 1000);

  const retryAfter = response.headers.get("retry-after");
  return retryAfter
    ? new Date(Date.now() + Number(retryAfter) * 1000)
    : undefined;
}
