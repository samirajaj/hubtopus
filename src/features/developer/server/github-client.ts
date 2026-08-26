import "server-only";

import { getPublicGitHubToken } from "@/lib/config/server";
import { requestGitHub } from "@/lib/github/client";

const REVALIDATE_SECONDS = 900;

export async function requestPublicGitHub(
  path: string,
  options: { allowNotFound?: boolean; accept?: string } = {},
): Promise<unknown | null> {
  return requestGitHub(path, {
    token: getPublicGitHubToken(),
    accept: options.accept,
    allowNotFound: options.allowNotFound,
    notFoundMessage: "That GitHub user was not found.",
    cache: { revalidate: REVALIDATE_SECONDS },
  });
}
