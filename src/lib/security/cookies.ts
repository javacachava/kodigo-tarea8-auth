const isProduction = process.env.NODE_ENV === "production";

/** Cookie name starts with __Host- in production, which prevents Domain/path abuse. */
export const authCookieName = isProduction
  ? "__Host-kodigo-auth"
  : "kodigo-auth";

export const csrfCookieName = isProduction
  ? "__Host-kodigo-csrf"
  : "kodigo-csrf";

export const csrfRequestHeader = "x-kodigo-csrf";

export function authCookieOptions() {
  return {
    name: authCookieName,
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
  };
}

/**
 * Supabase supplies expiry metadata while rotating a session. Preserve that
 * metadata but never allow a callback to weaken our security flags.
 */
export function secureCookieOptions(options: Record<string, unknown> = {}) {
  return {
    ...options,
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
  };
}

export function csrfCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    maxAge: 60 * 60,
  };
}
