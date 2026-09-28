import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autenticación segura con Next.js y Supabase",
  description:
    "Demostración de autenticación server-first con cookies HttpOnly, CSRF y Supabase.",
};

export default function HomePage() {
  return (
    <section className="home-page">
      <div className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">Next.js 16 · Supabase · TypeScript</p>
          <h1>Autenticación que protege lo que importa.</h1>
          <p className="hero-description">
            Una referencia práctica de sesiones del lado del servidor, cookies HttpOnly,
            protección CSRF y rutas privadas.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/sign-up">
              Crear una cuenta
            </Link>
            <Link className="button button-secondary" href="/sign-in">
              Ya tengo una cuenta
            </Link>
          </div>
        </div>

        <aside aria-label="Capas de seguridad incluidas" className="security-panel">
          <div className="shield-icon" aria-hidden="true">
            ✓
          </div>
          <p className="panel-label">Defensa en profundidad</p>
          <ul>
            <li>Cookies HttpOnly y Secure</li>
            <li>Server Actions con validación Zod</li>
            <li>Protección CSRF de doble comprobación</li>
            <li>CSP, cabeceras y rutas protegidas</li>
          </ul>
        </aside>
      </div>

      <div className="feature-grid" aria-label="Características">
        <article className="feature-card">
          <span className="feature-number">01</span>
          <h2>Sin tokens en JavaScript</h2>
          <p>La sesión vive en cookies inaccesibles desde scripts del navegador.</p>
        </article>
        <article className="feature-card">
          <span className="feature-number">02</span>
          <h2>Identidad verificada</h2>
          <p>Proxy, páginas y acciones validan la sesión en el servidor.</p>
        </article>
        <article className="feature-card">
          <span className="feature-number">03</span>
          <h2>Recuperación segura</h2>
          <p>Los enlaces de recuperación se intercambian en un Route Handler.</p>
        </article>
      </div>
    </section>
  );
}
