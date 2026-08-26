import "server-only";

import { isProduction } from "@/lib/config/server";

export function secureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    priority: "high" as const,
  };
}
