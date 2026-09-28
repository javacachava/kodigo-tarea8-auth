import type { ActionFieldErrors } from "@/lib/auth/validation";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: ActionFieldErrors;
};

export const initialAuthActionState: AuthActionState = { status: "idle" };
