import { NextRequest, NextResponse } from "next/server";

import {
  exchangeGitHubAppCode,
  getGitHubCallbackUrl,
  getOAuthStateCookieName,
  getOAuthStateCookieOptions,
  isValidOAuthState,
  validateGitHubToken,
} from "@/lib/github-auth";
import {
  createGitHubSession,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/github-session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(getOAuthStateCookieName())?.value;

  if (request.nextUrl.searchParams.has("error") || !code || code.length > 256) {
    return finish(request, "/connect?error=github-app-denied");
  }

  if (!isValidOAuthState(expectedState, state)) {
    return finish(request, "/connect?error=github-app-state");
  }

  const callbackUrl = getGitHubCallbackUrl(request.nextUrl.origin);
  const token = await exchangeGitHubAppCode(code, callbackUrl);
  if (!token) return finish(request, "/connect?error=github-app-exchange");

  const login = await validateGitHubToken(token.accessToken);
  if (!login) return finish(request, "/connect?error=github-app-exchange");

  const maxAge = token.expiresIn
    ? Math.max(60, token.expiresIn - 60)
    : undefined;
  const response = finish(request, "/workspace");
  response.cookies.set(
    getSessionCookieName(),
    createGitHubSession(token.accessToken, login, {
      method: "github-app",
      maxAge,
    }),
    getSessionCookieOptions(maxAge),
  );
  return response;
}

function finish(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url), 303);
  response.cookies.set(getOAuthStateCookieName(), "", {
    ...getOAuthStateCookieOptions(),
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
