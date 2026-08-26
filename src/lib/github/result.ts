import { GitHubApiError } from "@/lib/github/errors";

export type OptionalDataStatus = "ready" | "rate-limit" | "unavailable";

export type OptionalData<T> = {
  status: OptionalDataStatus;
  data: T;
};

export async function loadOptional<T>(
  loader: () => Promise<T>,
  fallback: T,
): Promise<OptionalData<T>> {
  try {
    return { status: "ready", data: await loader() };
  } catch (error) {
    return {
      status:
        error instanceof GitHubApiError && error.kind === "rate-limit"
          ? "rate-limit"
          : "unavailable",
      data: fallback,
    };
  }
}
