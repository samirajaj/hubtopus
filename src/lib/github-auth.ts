import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import {
  getGitHubAppConfig,
  getSiteUrl,
  isProduction,
  type GitHubAppConfig,
} from "@/lib/config/server";
import { requestGitHub } from "@/lib/github/client";
import { parseGitHubResponse } from "@/lib/github/parse";
import { secureCookieOptions } from "@/lib/http/cookies";

const userSchema = z.object({ login: z.string().min(1).max(39) });
const tokenResponseSchema = z.object({
  access_token: z.string().min(20).max(512),
  expires_in: z.number().int().positive().optional(),
  token_type: z.string(),
});

export type { GitHubAppConfig };
export { getGitHubAppConfig };

export function isGitHubAppConfigured(): boolean {
  return Boolean(getGitHubAppConfig());
}

export function getOAuthStateCookieName(): string {
  return isProduction()
    ? "__Host-hubtopus-oauth-state"
    : "hubtopus-oauth-state";
}

export function getOAuthStateCookieOptions() {
  return secureCookieOptions(60 * 10);
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
  const origin = getSiteUrl()?.origin ?? requestOrigin;
  return new URL("/api/auth/github/callback", origin).toString();
}

export async function validateGitHubToken(
  token: string,
): Promise<string | null> {
  try {
    const raw = await requestGitHub("/user", {
      token,
      cache: "no-store",
      unauthorizedMessage: "GitHub rejected the supplied token.",
    });
    return parseGitHubResponse(userSchema, raw, "authenticated user data")
      .login;
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
