# Kodigo Secure Auth

Aplicación de referencia para la actividad **Seguridad de Autenticación con Cookies httpOnly en Next.js**. Implementa una capa de autenticación con Next.js 16 (App Router), TypeScript, Supabase Auth/Database, Server Actions y el `proxy.ts` de Next.js 16 (la convención que sustituyó a `middleware.ts`).

- **Repositorio:** https://github.com/javacachava/kodigo-tarea8-auth
- **Aplicación desplegada:** https://kodigo-tarea8-auth.vercel.app

## Qué incluye

- Registro, inicio de sesión, cierre de sesión, confirmación de correo y recuperación/cambio de contraseña.
- Server Actions con validación de servidor mediante Zod y mensajes de error seguros.
- Sesión en cookies con `HttpOnly`, `Secure` en producción, `SameSite=Lax`, `Path=/` y prefijo `__Host-` en producción.
- Protección de rutas en `src/proxy.ts`, con renovación de sesión y redirecciones optimistas.
- Doble verificación de identidad en el dashboard y la acción de cambio de contraseña con `auth.getUser()`.
- CSRF: validación Origin/Host de Next.js + validación explícita + token de formulario ligado a una cookie `HttpOnly` `SameSite=Strict`.
- Prevención XSS: React no interpreta HTML aportado por usuarios, CSP con nonce, `frame-ancestors 'none'`, `nosniff`, política de referencias y permisos mínimos.
- Perfil de Supabase con migración, trigger de alta y políticas RLS de mínimo privilegio.
- Metadatos, robots y sitemap para que solamente las páginas públicas se indexen.

## Arquitectura

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| Cliente público | `src/lib/supabase/client.ts` | Configuración para operaciones públicas; persiste **cero** sesiones. |
| Servidor | `src/lib/supabase/server.ts` | Crea un cliente por request para RSC y Server Actions. |
| Proxy/Middleware | `src/proxy.ts`, `src/lib/supabase/proxy.ts` | Refresca claims, aplica cookies/cabeceras y protege navegación. |
| Acciones | `src/app/actions/auth.ts` | Registro, login, logout, recuperación y cambio de contraseña. |
| Callback | `src/app/auth/confirm/route.ts` | Intercambia PKCE/OTP en el servidor y emite cookie segura. |
| Base de datos | `supabase/migrations/20260927120000_profiles.sql` | Perfil privado, trigger de registro y RLS. |

### Nota importante sobre `HttpOnly` y Supabase SSR

El patrón SSR usual de Supabase permite al browser leer la cookie para renovar el refresh token. Esta actividad exige explícitamente que ninguna credencial sea accesible desde JavaScript. Por eso este proyecto usa un patrón **BFF/server-first**: el navegador no ejecuta `supabase.auth.*`, no usa `localStorage` y no mantiene una sesión en el cliente; los Server Actions, Route Handler y Proxy administran la sesión `HttpOnly` en el servidor.

Esto es intencional. Si se agregan Realtime, OAuth del lado cliente o consultas autenticadas desde el browser, hay que rediseñar el flujo antes de habilitarlos; no se debe debilitar `httpOnly` para “hacerlos funcionar”.

## Requisitos

- Node.js 20.9 o superior (se recomienda Node 22).
- Una cuenta/proyecto de Supabase.
- npm 10 o superior.

## Instalación local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea las variables locales sin versionarlas:

   ```bash
   cp .env.example .env.local
   ```

3. En **Supabase → Project Settings → API**, copia únicamente:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<tu-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu-publishable-key>
   APP_URL=http://localhost:3000
   ```

   Nunca agregues `service_role`, `secret key` ni una contraseña de base de datos a `NEXT_PUBLIC_*` ni al repositorio.

4. Aplica la migración en el SQL Editor de Supabase o con la CLI:

   ```bash
   npx supabase link --project-ref <tu-project-ref>
   npx supabase db push
   ```

5. En **Authentication → URL Configuration**, configura:

   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/confirm**`
   - Para producción, agrega `https://tu-dominio/auth/confirm**`.

   El sufijo `**` es intencional: Supabase agrega el parámetro seguro
   `sb_flow_id` para correlacionar flujos PKCE abiertos en pestañas distintas.
   No sustituyas esa ruta por un comodín para todo el dominio.

   Si personalizas las plantillas de email, conserva `{{ .ConfirmationURL }}`
   o usa `{{ .RedirectTo }}`; no construyas el enlace con `{{ .SiteURL }}`.

6. En **Authentication → Providers → Email**, habilita la confirmación de correo. Para producción configura SMTP, protección contra contraseñas filtradas, rate limits y CAPTCHA.

7. Ejecuta la aplicación:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Verificación antes de entregar

```bash
npm run typecheck
npm run lint
npm run build
```

Prueba manualmente lo siguiente:

1. Crear una cuenta y confirmar el correo desde el enlace enviado.
2. Iniciar/cerrar sesión y comprobar que `/dashboard` redirige a `/sign-in` sin sesión.
3. Abrir DevTools → Application: no debe existir token en `localStorage`; la cookie de sesión debe indicar `HttpOnly` y, en producción, `Secure`.
4. Solicitar recuperación, abrir el enlace y guardar una nueva contraseña.
5. Intentar enviar una acción desde otro origen o con un `csrfToken` modificado: debe rechazarse.
6. Revisar en producción los encabezados `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y `Strict-Transport-Security`.

## Rutas

| Ruta | Acceso | Función |
| --- | --- | --- |
| `/` | Público | Página de presentación indexable. |
| `/sign-up` | Solo visitante | Registro y confirmación de correo. |
| `/sign-in` | Solo visitante | Inicio de sesión. |
| `/forgot-password` | Público | Solicita recuperación sin revelar si existe el correo. |
| `/auth/confirm` | Callback | Canjea el código PKCE/OTP, no es indexable. |
| `/reset-password` | Sesión de recuperación | Cambia la contraseña. |
| `/dashboard` | Autenticado | Muestra perfil protegido por RLS. |

## Controles de seguridad y amenazas cubiertas

| Riesgo | Control aplicado |
| --- | --- |
| Robo de token vía XSS | Sesión `HttpOnly`, sin `localStorage`, CSP con nonce, React escapando contenido y sin `dangerouslySetInnerHTML`. |
| CSRF | `SameSite`, comprobación Origin/Host propia y de Server Actions, token oculto cotejado con cookie HttpOnly en tiempo constante. |
| Sesión caducada | `proxy.ts` llama `getClaims()` y propaga las cookies rotadas y headers de caché. |
| Dos enlaces PKCE simultáneos | `sb_flow_id` conserva un code verifier separado para cada registro o recuperación. |
| Autorización basada en datos no fiables | Dashboard/acciones usan `getUser()`; nunca se autoriza con `getSession()`. |
| Caché de una sesión ajena | Respuestas del proxy y callback usan `Cache-Control: private, no-store`. |
| Open redirect | `next` acepta únicamente rutas internas sin `//` ni barras inversas. |
| Acceso excesivo a datos | Tabla `profiles` con RLS; cada usuario solo puede consultar su propio perfil. |

## Despliegue en Vercel

1. Crea un repositorio público y sube este directorio:

   ```bash
   git init
   git add .
   git commit -m "feat: secure Supabase auth with HttpOnly cookies"
   git branch -M main
   git remote add origin https://github.com/<usuario>/<repositorio>.git
   git push -u origin main
   ```

2. Importa el repositorio en Vercel y define las tres variables de `.env.example` para Production, Preview y Development según corresponda.
3. Actualiza `APP_URL` a la URL HTTPS exacta de cada entorno (sin path) y agrega la Redirect URL de Vercel en Supabase.
4. Ejecuta el flujo de pruebas de la sección anterior sobre HTTPS.

## Decisiones de implementación

- Next.js 16 cambió el nombre de `middleware.ts` a `proxy.ts`; conserva la misma función de interceptar requests, por lo que cumple el requisito de middleware sin usar una API deprecada.
- `secure: false` solamente en `localhost` de desarrollo: las cookies `Secure` no funcionan sobre HTTP. En producción se obliga `Secure: true` y se usa HSTS.
- En producción `APP_URL` es obligatorio, HTTPS y sin path: los enlaces de correo y los redirects de callback se fijan a esa URL canónica, nunca a un encabezado `Host` recibido.
- Las claves publicables de Supabase sí pueden ir en `NEXT_PUBLIC_*`; no autorizan operaciones por sí solas. La protección efectiva de datos está en Auth + RLS.
- La migración no otorga inserción/actualización directa al rol `authenticated`; el trigger crea perfiles bajo control de base de datos.

## Referencias

- [Supabase SSR: crear un cliente](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase SSR: consideraciones avanzadas](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Next.js 16 Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [Next.js Server Actions y `allowedOrigins`](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
