import "server-only";

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { authCookieOptions, secureCookieOptions } from "@/lib/security/cookies";
import { serverAuthOptions } from "@/lib/supabase/auth-options";
import { getSupabaseEnvironment } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

async function createClient(canWriteCookies: boolean) {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnvironment();

  return createSupabaseServerClient<Database>(url, publishableKey, {
    auth: serverAuthOptions,
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Server Components are read-only. Server Actions and Route Handlers
        // call the writable variant below; the proxy refreshes RSC sessions.
        if (!canWriteCookies) return;

        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, secureCookieOptions(options));
        });
      },
    },
  });
}

/** Use from Server Components. Session rotation is owned by proxy.ts. */
export async function createServerClient() {
  return createClient(false);
}

/** Use only from Server Actions, where Next permits setting response cookies. */
export async function createActionClient() {
  return createClient(true);
}
