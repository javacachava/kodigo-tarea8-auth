import type { AuthActionState } from "@/lib/auth/action-state";

type FormFeedbackProps = {
  state: AuthActionState;
};

export function FormFeedback({ state }: FormFeedbackProps) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <p
      aria-live="polite"
      className={`form-feedback form-feedback-${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;

  return (
    <p className="field-error" id={id} role="alert">
      {message}
    </p>
  );
}
