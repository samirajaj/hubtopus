import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const userSchema = z.object({ login: z.string().min(1).max(39) });
const tokenResponseSchema = z.object({
  access_token: z.string().min(20).max(512),
  expires_in: z.number().int().positive().optional(),
  token_type: z.string(),
});

export type GitHubAppConfig = {
  clientId: string;
  clientSecret: string;
};

export function getGitHubAppConfig(): GitHubAppConfig | null {
  const clientId = process.env.GITHUB_APP_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function isGitHubAppConfigured(): boolean {
  return Boolean(getGitHubAppConfig());
}

export function getOAuthStateCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-hubtopus-oauth-state"
    : "hubtopus-oauth-state";
}

export function getOAuthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
    priority: "high" as const,
  };
}

export function createOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function isValidOAuthState(
  expected: string | undefined,
  received: string | null,
): boolean {
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export function getGitHubCallbackUrl(requestOrigin: string): string {
  let origin = requestOrigin;
  if (process.env.SITE_URL) {
    try {
      origin = new URL(process.env.SITE_URL).origin;
    } catch {
      origin = requestOrigin;
    }
  }
  return new URL("/api/auth/github/callback", origin).toString();
}

export async function validateGitHubToken(
  token: string,
): Promise<string | null> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: githubHeaders(token),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const result = userSchema.safeParse(await response.json());
    return result.success ? result.data.login : null;
  } catch {
    return null;
  }
}

export async function exchangeGitHubAppCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; expiresIn?: number } | null> {
  const config = getGitHubAppConfig();
  if (!config) return null;

  try {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Hubtopus",
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;

    const result = tokenResponseSchema.safeParse(await response.json());
    if (!result.success) return null;
    return {
      accessToken: result.data.access_token,
      expiresIn: result.data.expires_in,
    };
  } catch {
    return null;
  }
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Hubtopus",
  };
}
