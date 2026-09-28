"use client";

import { createBrowserClient } from "@supabase/ssr";

import { authCookieOptions } from "@/lib/security/cookies";
import { getSupabaseEnvironment } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Optional client for explicitly public, unauthenticated operations.
 *
 * This project deliberately keeps authenticated Supabase operations on the
 * server so the auth cookie can remain HttpOnly. Do not call `auth.*` with
 * this client and do not enable session persistence here.
 */
export function createPublicBrowserClient() {
  const { url, publishableKey } = getSupabaseEnvironment();

  return createBrowserClient<Database>(url, publishableKey, {
    cookieOptions: authCookieOptions(),
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
