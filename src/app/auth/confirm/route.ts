import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { authCookieOptions, secureCookieOptions } from "@/lib/security/cookies";
import {
  callbackApplicationOrigin,
  safeRedirectPath,
} from "@/lib/security/request-origin";
import { getSupabaseEnvironment } from "@/lib/supabase/env";
import { serverAuthOptions } from "@/lib/supabase/auth-options";
import type { Database } from "@/lib/supabase/types";

const otpTypes = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;

type EmailOtpType = (typeof otpTypes)[number];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && otpTypes.includes(value as EmailOtpType));
}

function copyCookies(source: NextResponse, destination: NextResponse): void {
  source.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie));
}

/**
 * Exchanges Supabase's PKCE code (or verifies an OTP token hash) entirely on
 * the server, then writes the resulting session as an HttpOnly cookie.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const query = request.nextUrl.searchParams;
  const code = query.get("code");
  const flowId = query.get("sb_flow_id");
  const tokenHash = query.get("token_hash");
  const type = query.get("type");
  const next = safeRedirectPath(query.get("next"));
  let applicationOrigin: string;

  try {
    applicationOrigin = callbackApplicationOrigin(request.nextUrl.origin);
  } catch {
    // Validate deployment configuration before consuming a one-time code.
    return new NextResponse(null, { status: 400 });
  }

  const { url, publishableKey } = getSupabaseEnvironment();

  const cookieResponse = NextResponse.next();
  const supabase = createServerClient<Database>(url, publishableKey, {
    auth: serverAuthOptions,
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieResponse.cookies.set(name, value, secureCookieOptions(options));
        });
        Object.entries(headersToSet).forEach(([key, value]) =>
          cookieResponse.headers.set(key, value),
        );
      },
    },
  });

  let hasError = true;

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );
      hasError = Boolean(error);
    } else if (tokenHash && isEmailOtpType(type)) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      hasError = Boolean(error);
    }
  } catch {
    hasError = true;
  }

  const destination = new URL(hasError ? "/sign-in" : next, applicationOrigin);
  if (hasError) destination.search = "?error=confirmation";

  const response = NextResponse.redirect(destination);
  copyCookies(cookieResponse, response);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
