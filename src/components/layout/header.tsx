import Link from "next/link";

import { signOutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";

type HeaderProps = {
  csrfToken: string;
  user: { email?: string | null } | null;
};

export function Header({ csrfToken, user }: HeaderProps) {
  return (
    <header className="site-header">
      <nav aria-label="Navegación principal" className="nav-shell">
        <Link className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            K
          </span>
          Kodigo Secure
        </Link>

        <div className="nav-actions">
          {user ? (
            <>
              <Link className="nav-user" href="/dashboard">
                {user.email ?? "Mi cuenta"}
              </Link>
              <form action={signOutAction}>
                <input name="csrfToken" type="hidden" value={csrfToken} />
                <SubmitButton className="button button-secondary button-small" pendingLabel="Cerrando…">
                  Salir
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <Link className="button button-ghost button-small" href="/sign-in">
                Iniciar sesión
              </Link>
              <Link className="button button-primary button-small" href="/sign-up">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
