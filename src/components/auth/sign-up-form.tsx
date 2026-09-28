"use client";

import { useActionState } from "react";

import { signUpAction } from "@/app/actions/auth";
import { FormFeedback, FieldError } from "@/components/auth/form-feedback";
import { SubmitButton } from "@/components/auth/submit-button";
import { initialAuthActionState } from "@/lib/auth/action-state";

type SignUpFormProps = {
  csrfToken: string;
};

export function SignUpForm({ csrfToken }: SignUpFormProps) {
  const [state, formAction] = useActionState(signUpAction, initialAuthActionState);
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="auth-form">
      <input name="csrfToken" type="hidden" value={csrfToken} />

      <div className="field-group">
        <label htmlFor="displayName">Nombre</label>
        <input
          aria-invalid={Boolean(errors?.displayName?.[0])}
          autoComplete="name"
          id="displayName"
          maxLength={80}
          minLength={2}
          name="displayName"
          placeholder="Tu nombre"
          required
          type="text"
        />
        <FieldError message={errors?.displayName?.[0]} />
      </div>

      <div className="field-group">
        <label htmlFor="email">Correo electrónico</label>
        <input
          aria-invalid={Boolean(errors?.email?.[0])}
          autoComplete="email"
          id="email"
          inputMode="email"
          name="email"
          placeholder="tu@correo.com"
          required
          type="email"
        />
        <FieldError message={errors?.email?.[0]} />
      </div>

      <div className="field-group">
        <label htmlFor="password">Contraseña</label>
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
          12+ caracteres, mayúscula, minúscula y número.
        </p>
        <FieldError message={errors?.password?.[0]} />
      </div>

      <div className="field-group">
        <label htmlFor="confirmPassword">Confirmar contraseña</label>
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
      <SubmitButton pendingLabel="Creando cuenta…">Crear cuenta segura</SubmitButton>
    </form>
  );
}
