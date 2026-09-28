"use client";

import { useActionState } from "react";

import { requestPasswordResetAction } from "@/app/actions/auth";
import { FormFeedback, FieldError } from "@/components/auth/form-feedback";
import { SubmitButton } from "@/components/auth/submit-button";
import { initialAuthActionState } from "@/lib/auth/action-state";

type ForgotPasswordFormProps = {
  csrfToken: string;
};

export function ForgotPasswordForm({ csrfToken }: ForgotPasswordFormProps) {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialAuthActionState,
  );
  const emailError = state.fieldErrors?.email?.[0];

  return (
    <form action={formAction} className="auth-form">
      <input name="csrfToken" type="hidden" value={csrfToken} />
      <div className="field-group">
        <label htmlFor="email">Correo electrónico</label>
        <input
          aria-invalid={Boolean(emailError)}
          autoComplete="email"
          id="email"
          inputMode="email"
          name="email"
          placeholder="tu@correo.com"
          required
          type="email"
        />
        <FieldError message={emailError} />
      </div>
      <FormFeedback state={state} />
      <SubmitButton pendingLabel="Enviando…">Enviar enlace seguro</SubmitButton>
    </form>
  );
}
