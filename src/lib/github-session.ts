import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";

import { getSessionSecret, isProduction } from "@/lib/config/server";
import { secureCookieOptions } from "@/lib/http/cookies";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const sessionSchema = z.object({
  token: z.string().min(20).max(512),
  login: z.string().min(1).max(39),
  method: z.enum(["personal-token", "github-app"]).default("personal-token"),
  expiresAt: z.number().int().positive(),
});

export type GitHubSession = z.infer<typeof sessionSchema>;

export function getSessionCookieName(): string {
  return isProduction() ? "__Host-hubtopus-session" : "hubtopus-session";
}

export function getSessionCookieOptions(maxAge = SESSION_DURATION_SECONDS) {
  return secureCookieOptions(maxAge);
}

export function isSessionConfigured(): boolean {
  return Boolean(getSessionSecret());
}

export async function readGitHubSession(): Promise<GitHubSession | null> {
  const value = (await cookies()).get(getSessionCookieName())?.value;
  if (!value) return null;

  try {
    const session = sessionSchema.parse(decrypt(value));
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function createGitHubSession(
  token: string,
  login: string,
  options: {
    method?: GitHubSession["method"];
    maxAge?: number;
  } = {},
): string {
  const maxAge = Math.min(
    options.maxAge ?? SESSION_DURATION_SECONDS,
    SESSION_DURATION_SECONDS,
  );
  const session: GitHubSession = {
    token,
    login,
    method: options.method ?? "personal-token",
    expiresAt: Date.now() + maxAge * 1000,
  };
  return encrypt(session);
}

function encrypt(value: GitHubSession): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, ciphertext]
    .map((part) => part.toString("base64url"))
    .join(".");
}

function decrypt(value: string): unknown {
  const [encodedIv, encodedTag, encodedCiphertext, extra] = value.split(".");
  if (!encodedIv || !encodedTag || !encodedCiphertext || extra) {
    throw new Error("Invalid session payload.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8"));
}

function getEncryptionKey(): Buffer {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error(
      "HUBTOPUS_SESSION_SECRET must contain at least 32 characters.",
    );
  }
  return createHash("sha256").update(secret, "utf8").digest();
}
