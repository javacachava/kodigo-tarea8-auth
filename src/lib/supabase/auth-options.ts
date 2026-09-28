/**
 * Supabase SSR always uses PKCE. Retain a verifier per flow so a signup or
 * recovery started in another tab cannot overwrite the callback verifier.
 */
export const serverAuthOptions = {
  experimental: {
    appendPkceFlowIdToRedirects: true,
  },
} as const;
