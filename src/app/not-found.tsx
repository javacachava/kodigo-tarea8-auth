import Link from "next/link";

export default function NotFound() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Error 404</p>
        <h1>Esta página no existe</h1>
        <p className="auth-intro">Comprueba la dirección o vuelve a la página principal.</p>
        <Link className="button button-primary" href="/">
          Ir al inicio
        </Link>
      </div>
    </section>
  );
}
