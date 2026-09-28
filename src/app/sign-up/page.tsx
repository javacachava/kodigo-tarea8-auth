import Link from "next/link";
import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { getCsrfTokenForForm } from "@/lib/security/csrf";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false },
};

export default async function SignUpPage() {
  const csrfToken = await getCsrfTokenForForm();

  return (
    <section className="auth-page">
      <div className="auth-card auth-card-wide">
        <p className="eyebrow">Empieza con seguridad</p>
        <h1>Crea tu cuenta</h1>
        <p className="auth-intro">
          Te enviaremos un enlace de confirmación antes de activar tu acceso.
        </p>
        <SignUpForm csrfToken={csrfToken} />
        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link href="/sign-in">Iniciar sesión</Link>
        </p>
      </div>
    </section>
  );
}
