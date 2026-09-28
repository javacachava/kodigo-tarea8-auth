import Link from "next/link";
import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";
import { getCsrfTokenForForm } from "@/lib/security/csrf";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

type SignInPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

function pageNotice(params: { error?: string; message?: string }): string | undefined {
  if (params.message === "password-updated") {
    return "Tu contraseña fue actualizada. Inicia sesión con la nueva contraseña.";
  }
  if (params.error === "confirmation") {
    return "El enlace no es válido o ya venció. Solicita uno nuevo si lo necesitas.";
  }
  if (params.error === "security") {
    return "La solicitud anterior no pudo verificarse. Inténtalo nuevamente.";
  }
  return undefined;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [csrfToken, params] = await Promise.all([getCsrfTokenForForm(), searchParams]);
  const notice = pageNotice(params);

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Acceso protegido</p>
        <h1>Bienvenido de nuevo</h1>
        <p className="auth-intro">Inicia sesión para entrar a tu espacio privado.</p>
        {notice ? <p className="page-notice" role="status">{notice}</p> : null}
        <SignInForm csrfToken={csrfToken} />
        <p className="auth-footer">
          ¿Aún no tienes cuenta? <Link href="/sign-up">Crear una cuenta</Link>
        </p>
      </div>
    </section>
  );
}
