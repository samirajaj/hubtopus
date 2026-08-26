export type GitHubErrorKind = "not-found" | "rate-limit" | "unavailable";

export class GitHubApiError extends Error {
  constructor(
    public readonly kind: GitHubErrorKind,
    message: string,
    public readonly resetAt?: Date,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}
