"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  type AuthActionState,
  initialAuthActionState,
} from "@/lib/auth/action-state";
import {
  fieldErrors,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/validation";
import { assertValidCsrfToken } from "@/lib/security/csrf";
import { assertSameOrigin, trustedApplicationOrigin } from "@/lib/security/request-origin";
import { createActionClient } from "@/lib/supabase/server";

function valueFrom(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function securityError(): AuthActionState {
  return {
    status: "error",
    message: "La solicitud no pudo verificarse. Recarga la página e inténtalo nuevamente.",
  };
}

async function validateMutationRequest(formData: FormData): Promise<string | null> {
  try {
    const requestOrigin = await assertSameOrigin();
    await assertValidCsrfToken(formData);
    return trustedApplicationOrigin(requestOrigin);
  } catch {
    return null;
  }
}

export async function signInAction(
  _previousState: AuthActionState = initialAuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previousState;
  const origin = await validateMutationRequest(formData);
  if (!origin) return securityError();

  const parsed = signInSchema.safeParse({
    email: valueFrom(formData, "email"),
    password: valueFrom(formData, "password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    const supabase = await createActionClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return {
        status: "error",
        message: "No fue posible iniciar sesión con esas credenciales.",
      };
    }
  } catch {
    return {
      status: "error",
      message: "No pudimos procesar el inicio de sesión. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: AuthActionState = initialAuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previousState;
  const origin = await validateMutationRequest(formData);
  if (!origin) return securityError();

  const parsed = signUpSchema.safeParse({
    displayName: valueFrom(formData, "displayName"),
    email: valueFrom(formData, "email"),
    password: valueFrom(formData, "password"),
    confirmPassword: valueFrom(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  let hasSession = false;

  try {
    const supabase = await createActionClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
      },
    });

    if (error) {
      return {
        status: "error",
        message: "No pudimos crear la cuenta. Verifica los datos e inténtalo otra vez.",
      };
    }

    // Some development projects disable email confirmation. The secure cookie
    // was set by the action, so the user may continue immediately in that case.
    hasSession = Boolean(data.session);
  } catch {
    return {
      status: "error",
      message: "No pudimos crear la cuenta. Inténtalo de nuevo más tarde.",
    };
  }

  if (hasSession) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    status: "success",
    message:
      "Si el correo puede registrarse, te enviamos un enlace de confirmación. Revisa también tu carpeta de spam.",
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState = initialAuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previousState;
  const origin = await validateMutationRequest(formData);
  if (!origin) return securityError();

  const parsed = forgotPasswordSchema.safeParse({ email: valueFrom(formData, "email") });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa el correo ingresado.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    const supabase = await createActionClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/confirm?next=/reset-password`,
    });
  } catch {
    // Keep this message account-enumeration safe even if the provider fails.
  }

  return {
    status: "success",
    message:
      "Si existe una cuenta asociada, recibirás un enlace para restablecer tu contraseña.",
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState = initialAuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previousState;
  const origin = await validateMutationRequest(formData);
  if (!origin) return securityError();

  const parsed = resetPasswordSchema.safeParse({
    password: valueFrom(formData, "password"),
    confirmPassword: valueFrom(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    const supabase = await createActionClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        status: "error",
        message: "Tu enlace de recuperación venció. Solicita uno nuevo.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      return {
        status: "error",
        message: "No pudimos actualizar la contraseña. Solicita un enlace nuevo.",
      };
    }

    // End the recovery session so a fresh login is required with the new password.
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    return {
      status: "error",
      message: "No pudimos actualizar la contraseña. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/sign-in?message=password-updated");
}

export async function signOutAction(formData: FormData): Promise<void> {
  const origin = await validateMutationRequest(formData);
  if (!origin) {
    redirect("/sign-in?error=security");
  }

  try {
    const supabase = await createActionClient();
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Redirecting to a public route is safe even when the remote logout fails.
  }

  revalidatePath("/", "layout");
  redirect("/sign-in");
}
