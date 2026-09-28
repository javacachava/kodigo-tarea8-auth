"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "@/app/actions/auth";
import { FormFeedback, FieldError } from "@/components/auth/form-feedback";
import { SubmitButton } from "@/components/auth/submit-button";
import { initialAuthActionState } from "@/lib/auth/action-state";

type ResetPasswordFormProps = {
  csrfToken: string;
};

export function ResetPasswordForm({ csrfToken }: ResetPasswordFormProps) {
  const [state, formAction] = useActionState(resetPasswordAction, initialAuthActionState);
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="auth-form">
      <input name="csrfToken" type="hidden" value={csrfToken} />
      <div className="field-group">
        <label htmlFor="password">Nueva contraseña</label>
        <input
          aria-describedby="password-help"
          aria-invalid={Boolean(errors?.password?.[0])}
          autoComplete="new-password"
          id="password"
          maxLength={128}
          minLength={12}
          name="password"
          required
          type="password"
        />
        <p className="field-help" id="password-help">
          Usa 12+ caracteres con mayúscula, minúscula y número.
        </p>
        <FieldError message={errors?.password?.[0]} />
      </div>
      <div className="field-group">
        <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
        <input
          aria-invalid={Boolean(errors?.confirmPassword?.[0])}
          autoComplete="new-password"
          id="confirmPassword"
          maxLength={128}
          minLength={12}
          name="confirmPassword"
          required
          type="password"
        />
        <FieldError message={errors?.confirmPassword?.[0]} />
      </div>
      <FormFeedback state={state} />
      <SubmitButton pendingLabel="Actualizando…">Guardar nueva contraseña</SubmitButton>
    </form>
  );
}
