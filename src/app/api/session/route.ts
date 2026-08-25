import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createGitHubSession,
  getSessionCookieName,
  getSessionCookieOptions,
  isSessionConfigured,
} from "@/lib/github-session";

const tokenSchema = z.string().trim().min(20).max(512);
const userSchema = z.object({ login: z.string().min(1).max(39) });

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2048) {
    return new NextResponse("Request body too large", { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new NextResponse("Invalid form data", { status: 400 });
  }
  const intent = formData.get("intent");
  if (intent === "disconnect") {
    const response = NextResponse.redirect(
      new URL("/connect", request.url),
      303,
    );
    response.cookies.set(getSessionCookieName(), "", {
      ...getSessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  }

  if (!isSessionConfigured()) {
    return redirectWithError(request, "config");
  }

  const result = tokenSchema.safeParse(formData.get("token"));
  if (!result.success) return redirectWithError(request, "invalid");

  const login = await validateToken(result.data);
  if (!login) return redirectWithError(request, "invalid");

  const response = NextResponse.redirect(
    new URL("/workspace", request.url),
    303,
  );
  response.cookies.set(
    getSessionCookieName(),
    createGitHubSession(result.data, login),
    getSessionCookieOptions(),
  );
  return response;
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin === request.nextUrl.origin;
}

function redirectWithError(request: NextRequest, error: string) {
  const url = new URL("/connect", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

async function validateToken(token: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Hubtopus",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const result = userSchema.safeParse(await response.json());
    return result.success ? result.data.login : null;
  } catch {
    return null;
  }
}
