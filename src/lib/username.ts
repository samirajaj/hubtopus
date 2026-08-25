export const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

export function normalizeGitHubUsername(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let candidate = trimmed.replace(/^@/, "");

  try {
    const url = new URL(candidate);
    if (url.hostname.toLowerCase() !== "github.com") return null;
    candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } catch {
    // Plain usernames are expected to fail URL parsing.
  }

  if (!GITHUB_USERNAME_PATTERN.test(candidate)) return null;
  return candidate.toLowerCase();
}
