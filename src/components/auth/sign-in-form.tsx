"use client";

import { useActionState } from "react";

import { signInAction } from "@/app/actions/auth";
import { FormFeedback, FieldError } from "@/components/auth/form-feedback";
import { SubmitButton } from "@/components/auth/submit-button";
import { initialAuthActionState } from "@/lib/auth/action-state";

type SignInFormProps = {
  csrfToken: string;
};

export function SignInForm({ csrfToken }: SignInFormProps) {
  const [state, formAction] = useActionState(signInAction, initialAuthActionState);
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={formAction} className="auth-form">
      <input name="csrfToken" type="hidden" value={csrfToken} />

      <div className="field-group">
        <label htmlFor="email">Correo electrónico</label>
        <input
          aria-describedby={emailError ? "email-error" : undefined}
          aria-invalid={Boolean(emailError)}
          autoComplete="email"
          id="email"
          inputMode="email"
          name="email"
          placeholder="tu@correo.com"
          required
          type="email"
        />
        <FieldError id="email-error" message={emailError} />
      </div>

      <div className="field-group">
        <div className="label-row">
          <label htmlFor="password">Contraseña</label>
          <a href="/forgot-password">¿La olvidaste?</a>
        </div>
        <input
          aria-describedby={passwordError ? "password-error" : undefined}
          aria-invalid={Boolean(passwordError)}
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type="password"
        />
        <FieldError id="password-error" message={passwordError} />
      </div>

      <FormFeedback state={state} />
      <SubmitButton pendingLabel="Verificando…">Iniciar sesión</SubmitButton>
    </form>
  );
}
