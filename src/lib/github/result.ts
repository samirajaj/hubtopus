import { GitHubApiError } from "@/lib/github/errors";

export type RemoteResultStatus = "ready" | "rate-limit" | "unavailable";

export type RemoteResult<T> =
  | { status: "ready"; data: T }
  | { status: "rate-limit" }
  | { status: "unavailable"; reason: string };

export async function loadRemote<T>(
  loader: () => Promise<T>,
): Promise<RemoteResult<T>> {
  try {
    return { status: "ready", data: await loader() };
  } catch (error) {
    if (error instanceof GitHubApiError && error.kind === "rate-limit") {
      return { status: "rate-limit" };
    }

    return {
      status: "unavailable",
      reason:
        error instanceof GitHubApiError
          ? error.message
          : "GitHub data is currently unavailable.",
    };
  }
}

export function remoteDataOr<T>(result: RemoteResult<T>, fallback: T): T {
  return result.status === "ready" ? result.data : fallback;
}
