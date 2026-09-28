import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { getCsrfTokenForForm } from "@/lib/security/csrf";
import { createServerClient } from "@/lib/supabase/server";

import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Kodigo Secure | Autenticación segura",
    template: "%s | Kodigo Secure",
  },
  description:
    "Ejemplo de autenticación segura con Next.js, Supabase y cookies HttpOnly.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [csrfToken, supabase] = await Promise.all([getCsrfTokenForForm(), createServerClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es">
      <body>
        <Header csrfToken={csrfToken} user={user ? { email: user.email } : null} />
        <main>{children}</main>
      </body>
    </html>
  );
}
