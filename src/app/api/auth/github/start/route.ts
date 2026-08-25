import { NextRequest, NextResponse } from "next/server";

import {
  createOAuthState,
  getGitHubAppConfig,
  getGitHubCallbackUrl,
  getOAuthStateCookieName,
  getOAuthStateCookieOptions,
} from "@/lib/github-auth";
import { isSessionConfigured } from "@/lib/github-session";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const config = getGitHubAppConfig();
  if (!config || !isSessionConfigured()) {
    return connectError(request, "github-app-config");
  }

  const state = createOAuthState();
  const callbackUrl = getGitHubCallbackUrl(request.nextUrl.origin);
  const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizationUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizationUrl, 302);
  response.cookies.set(
    getOAuthStateCookieName(),
    state,
    getOAuthStateCookieOptions(),
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function connectError(request: NextRequest, error: string) {
  const url = new URL("/connect", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}
