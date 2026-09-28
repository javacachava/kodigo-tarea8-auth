import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard privado",
  robots: { index: false, follow: false },
};

function formattedDate(value: string | null | undefined): string {
  if (!value) return "Pendiente";

  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // This is the authorization boundary. The proxy redirect is only a first layer.
  if (userError || !user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const metadataName = user.user_metadata?.display_name;
  const displayName =
    profile?.display_name ?? (typeof metadataName === "string" ? metadataName : null) ?? "Usuario";

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Área privada</p>
          <h1>Hola, {displayName}</h1>
          <p>Esta información se renderiza en el servidor tras verificar tu identidad.</p>
        </div>
        <span className="verified-badge">Sesión verificada</span>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-card dashboard-card-main">
          <p className="card-label">Cuenta autenticada</p>
          <h2>{user.email ?? "Correo no disponible"}</h2>
          <dl className="account-details">
            <div>
              <dt>ID de usuario</dt>
              <dd className="monospace">{user.id}</dd>
            </div>
            <div>
              <dt>Correo confirmado</dt>
              <dd>{formattedDate(user.email_confirmed_at)}</dd>
            </div>
            <div>
              <dt>Cuenta creada</dt>
              <dd>{formattedDate(profile?.created_at ?? user.created_at)}</dd>
            </div>
          </dl>
        </article>

        <article className="dashboard-card security-summary">
          <p className="card-label">Controles activos</p>
          <ul>
            <li><span aria-hidden="true">✓</span> Cookie de sesión HttpOnly</li>
            <li><span aria-hidden="true">✓</span> Verificación en servidor</li>
            <li><span aria-hidden="true">✓</span> CSRF y SameSite</li>
            <li><span aria-hidden="true">✓</span> Cabeceras anti-XSS</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
