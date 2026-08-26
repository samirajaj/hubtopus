import "server-only";

import { requestGitHub } from "@/lib/github/request";

export async function authenticatedRequest(token: string, path: string) {
  return requestGitHub(path, {
    token,
    cache: "no-store",
    unauthorizedMessage: "The GitHub token is no longer valid.",
  });
}
