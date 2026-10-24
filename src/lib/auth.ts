import { createHash } from "crypto";

export const AUTH_COOKIE = "mindflow_auth";

// If APP_PASSWORD isn't set, auth is skipped entirely — keeps local dev
// frictionless. Set it before deploying anywhere public (e.g. Vercel).
export function computeAuthToken(): string | null {
  const password = process.env.APP_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`mindflow-auth:${password}`).digest("hex");
}
