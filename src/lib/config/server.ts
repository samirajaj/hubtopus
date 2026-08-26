import "server-only";

import { z } from "zod";

const urlSchema = z.url();
const tokenSchema = z.string().trim().min(1);
const sessionSecretSchema = z.string().trim().min(32);

export type GitHubAppConfig = {
  clientId: string;
  clientSecret: string;
};

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getSiteUrl(): URL | null {
  const value = process.env.SITE_URL?.trim();
  if (!value) return null;

  const result = urlSchema.safeParse(value);
  if (!result.success) {
    throw new Error("SITE_URL must be a valid absolute URL.");
  }
  return new URL(result.data);
}

export function getGitHubAppConfig(): GitHubAppConfig | null {
  const clientId = process.env.GITHUB_APP_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET?.trim();

  if (!clientId && !clientSecret) return null;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GITHUB_APP_CLIENT_ID and GITHUB_APP_CLIENT_SECRET must be configured together.",
    );
  }

  return { clientId, clientSecret };
}

export function getSessionSecret(): string | null {
  const value = process.env.HUBTOPUS_SESSION_SECRET;
  if (!value) return null;

  const result = sessionSecretSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      "HUBTOPUS_SESSION_SECRET must contain at least 32 characters.",
    );
  }
  return result.data;
}

export function getPublicGitHubToken(): string | undefined {
  const result = tokenSchema.safeParse(process.env.GITHUB_TOKEN);
  return result.success ? result.data : undefined;
}
