import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  authCookieOptions,
  csrfCookieName,
  csrfCookieOptions,
  csrfRequestHeader,
  secureCookieOptions,
} from "@/lib/security/cookies";
import { getSupabaseEnvironment } from "@/lib/supabase/env";
import { serverAuthOptions } from "@/lib/supabase/auth-options";
import type { Database } from "@/lib/supabase/types";

const protectedPaths = ["/dashboard", "/reset-password"];
const guestOnlyPaths = ["/sign-in", "/sign-up"];
const responseHeadersToPreserve = ["cache-control", "expires", "pragma"];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function copySessionState(source: NextResponse, destination: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie));

  responseHeadersToPreserve.forEach((header) => {
    const value = source.headers.get(header);
    if (value) destination.headers.set(header, value);
  });

  return destination;
}

function makeNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

function createContentSecurityPolicy(nonce: string, supabaseOrigin: string): string {
  const development = process.env.NODE_ENV !== "production";
  const scriptSource = development
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const connectSource = development
    ? `'self' ${supabaseOrigin} ws: wss:`
    : `'self' ${supabaseOrigin}`;

  return [
    "default-src 'self'",
    `script-src ${scriptSource}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSource}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function applySecurityHeaders(
  response: NextResponse,
  csp: string,
  containsCredentialInUrl: boolean,
): void {
  const development = process.env.NODE_ENV !== "production";

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set(
    "Referrer-Policy",
    containsCredentialInUrl ? "no-referrer" : "strict-origin-when-cross-origin",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  response.headers.set("Cache-Control", "private, no-store, max-age=0");

  if (!development) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
}

/**
 * Next.js 16 calls this file a Proxy (the renamed Middleware convention).
 * It refreshes the session, injects a per-request CSRF form token, and makes
 * only optimistic redirects; pages and actions verify authorization again.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const requestHeaders = new Headers(request.headers);
  const nonce = makeNonce();
  const csrfToken = request.cookies.get(csrfCookieName)?.value ?? crypto.randomUUID();
  const needsCsrfCookie = !request.cookies.get(csrfCookieName)?.value;

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(csrfRequestHeader, csrfToken);
  const { url, publishableKey } = getSupabaseEnvironment();
  const supabaseOrigin = new URL(url).origin;
  const contentSecurityPolicy = createContentSecurityPolicy(nonce, supabaseOrigin);

  // Next.js parses this request header while rendering to attach the nonce to
  // framework scripts and styles. The same policy is sent to the browser below.
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(url, publishableKey, {
    auth: serverAuthOptions,
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        // Make refreshed cookies available to the remainder of this proxy run.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        const updatedRequestHeaders = new Headers(requestHeaders);
        updatedRequestHeaders.set("cookie", request.cookies.toString());
        response = copySessionState(
          response,
          NextResponse.next({ request: { headers: updatedRequestHeaders } }),
        );

        Object.entries(headersToSet).forEach(([key, value]) => response.headers.set(key, value));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, secureCookieOptions(options));
        });
      },
    },
  });

  // Do not authorize server requests with getSession(): claims are verified.
  const { data: claimsData } = await supabase.auth.getClaims();
  const isAuthenticated = typeof claimsData?.claims.sub === "string";
  const { pathname } = request.nextUrl;

  if (!isAuthenticated && matchesPath(pathname, protectedPaths)) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.search = "";
    response = copySessionState(response, NextResponse.redirect(signInUrl));
  }

  if (isAuthenticated && matchesPath(pathname, guestOnlyPaths)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    response = copySessionState(response, NextResponse.redirect(dashboardUrl));
  }

  if (needsCsrfCookie) {
    response.cookies.set({
      name: csrfCookieName,
      value: csrfToken,
      ...csrfCookieOptions(),
    });
  }

  applySecurityHeaders(response, contentSecurityPolicy, pathname === "/auth/confirm");
  return response;
}
