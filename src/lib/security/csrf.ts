import "server-only";

import { timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

import { csrfCookieName, csrfRequestHeader } from "@/lib/security/cookies";

export class CsrfValidationError extends Error {
  constructor() {
    super("La solicitud no pudo verificarse. Recarga la página e inténtalo otra vez.");
    this.name = "CsrfValidationError";
  }
}

/** The proxy places a request-scoped token here before a page renders. */
export async function getCsrfTokenForForm(): Promise<string> {
  const requestHeaders = await headers();
  return requestHeaders.get(csrfRequestHeader) ?? "";
}

export async function assertValidCsrfToken(formData: FormData): Promise<void> {
  const submitted = formData.get("csrfToken");
  const cookieStore = await cookies();
  const stored = cookieStore.get(csrfCookieName)?.value;

  if (typeof submitted !== "string" || !stored) {
    throw new CsrfValidationError();
  }

  const submittedValue = Buffer.from(submitted, "utf8");
  const storedValue = Buffer.from(stored, "utf8");

  if (
    submittedValue.length !== storedValue.length ||
    !timingSafeEqual(submittedValue, storedValue)
  ) {
    throw new CsrfValidationError();
  }
}
