import "server-only";

import { headers } from "next/headers";

export class OriginValidationError extends Error {
  constructor() {
    super("La solicitud fue rechazada por seguridad. Vuelve a intentarlo.");
    this.name = "OriginValidationError";
  }
}

function firstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

/**
 * Server Actions already compare Origin and Host. This explicit check protects
 * our own action boundary too, including deployments behind a trusted proxy.
 */
export async function assertSameOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host =
    firstHeaderValue(requestHeaders.get("x-forwarded-host")) ??
    requestHeaders.get("host");
  const protocol =
    firstHeaderValue(requestHeaders.get("x-forwarded-proto")) ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (!origin || !host) {
    throw new OriginValidationError();
  }

  let receivedOrigin: URL;
  let expectedOrigin: URL;

  try {
    receivedOrigin = new URL(origin);
    expectedOrigin = new URL(`${protocol}://${host}`);
  } catch {
    throw new OriginValidationError();
  }

  if (
    receivedOrigin.origin !== expectedOrigin.origin ||
    (process.env.NODE_ENV === "production" && receivedOrigin.protocol !== "https:")
  ) {
    throw new OriginValidationError();
  }

  return expectedOrigin.origin;
}

function configuredApplicationOrigin(): string {
  const configuredUrl = process.env.APP_URL;

  if (!configuredUrl) {
    throw new OriginValidationError();
  }

  let appUrl: URL;
  try {
    appUrl = new URL(configuredUrl);
  } catch {
    throw new OriginValidationError();
  }

  if (
    appUrl.protocol !== "https:" ||
    appUrl.username ||
    appUrl.password ||
    appUrl.pathname !== "/" ||
    appUrl.search ||
    appUrl.hash
  ) {
    throw new OriginValidationError();
  }

  return appUrl.origin;
}

/**
 * Email callbacks must never be constructed from a Host/X-Forwarded-Host
 * value alone. Production pins them to the explicitly configured HTTPS origin.
 */
export function trustedApplicationOrigin(requestOrigin: string): string {
  if (process.env.NODE_ENV !== "production") return requestOrigin;

  const canonicalOrigin = configuredApplicationOrigin();
  if (canonicalOrigin !== requestOrigin) {
    throw new OriginValidationError();
  }

  return canonicalOrigin;
}

/** A callback may arrive without an Origin header, so only use the canonical URL. */
export function callbackApplicationOrigin(requestOrigin: string): string {
  if (process.env.NODE_ENV !== "production") return requestOrigin;
  return configuredApplicationOrigin();
}

/** Prevents open redirects when a confirmation link contains a `next` value. */
export function safeRedirectPath(value: string | null, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  return value;
}
