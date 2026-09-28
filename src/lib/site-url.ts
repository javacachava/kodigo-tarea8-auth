import "server-only";

export function getSiteUrl(): string {
  const candidate = process.env.APP_URL ?? "http://localhost:3000";

  try {
    return new URL(candidate).origin;
  } catch {
    return "http://localhost:3000";
  }
}
