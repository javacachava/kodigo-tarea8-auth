import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getCsrfTokenForForm } from "@/lib/security/csrf";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const [csrfToken, supabase] = await Promise.all([getCsrfTokenForForm(), createServerClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/forgot-password");

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Sesión de recuperación verificada</p>
        <h1>Elige una nueva contraseña</h1>
        <p className="auth-intro">Al guardarla, cerraremos esta sesión por seguridad.</p>
        <ResetPasswordForm csrfToken={csrfToken} />
      </div>
    </section>
  );
}
