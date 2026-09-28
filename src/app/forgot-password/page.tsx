import Link from "next/link";
import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCsrfTokenForForm } from "@/lib/security/csrf";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const csrfToken = await getCsrfTokenForForm();

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Recuperación de acceso</p>
        <h1>Restablece tu contraseña</h1>
        <p className="auth-intro">
          Si existe una cuenta para ese correo, enviaremos instrucciones seguras.
        </p>
        <ForgotPasswordForm csrfToken={csrfToken} />
        <p className="auth-footer">
          <Link href="/sign-in">Volver a iniciar sesión</Link>
        </p>
      </div>
    </section>
  );
}
