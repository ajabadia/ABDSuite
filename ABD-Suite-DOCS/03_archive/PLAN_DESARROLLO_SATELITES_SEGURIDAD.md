# 🛠️ PLAN DE DESARROLLO: Seguridad Satélite y Aislamiento Multi-Tenant (ABDQuiz / ABDtenantGovernance)

Este documento contiene las especificaciones técnicas y los pasos detallados de desarrollo que deben seguir las aplicaciones satélite del ecosistema ABD (por ejemplo, **`ABDQuiz`** y **`ABDtenantGovernance`**) para implementar la verificación criptográfica del token de sesión (`abd_session`) y la protección de dominio cruzado (Cross-Tenant Guard).

> [!IMPORTANT]
> **Normativa de Integración**:
> 1. Se debe utilizar la biblioteca `jose` para la validación y desencriptación del JWT en entornos del servidor de Next.js (incluyendo Proxy / Node Runtime).
> 2. Se debe configurar la clave secreta compartida en las variables de entorno: `AUTH_JWT_SECRET`. Esta clave **DEBE COINCIDIR EXACTAMENTE** con la configurada en `ABDAuth`.
> 3. Se debe evitar la persistencia de perfiles en texto plano en las cookies del cliente para prevenir suplantaciones.

> [!CAUTION]
> **Recordatorio de Configuración Crítica**:
> 1. **Clave Secreta Compartida (`AUTH_JWT_SECRET`)**: Ambos proyectos (ABDAuth y el satélite) deben tener configurada exactamente la misma clave. Si las claves no coinciden, el satélite rechazará todas las sesiones.
> 2. **Variables de Entorno del Ecosistema**: En el `.env.local` de desarrollo local, `AUTH_PROVIDER_URL` debe apuntar a `http://localhost:3400` y `NEXT_PUBLIC_APP_URL` al puerto local del satélite (ej: `http://localhost:3300` para ABDQuiz, `http://localhost:3500` para ABDtenantGovernance).
> 3. **Normas de Desarrollo Globales**: Respetar `FIRE:MAX_LINES` (150 líneas), usar `next-intl` para i18n (`FIRE:I18N_VIOLATION`), y ejecutar `pnpm run full-audit` antes de dar la tarea por finalizada.

---

## 📦 1. Instalación de Dependencias

Ejecutar en la raíz de cada aplicación satélite para instalar la biblioteca de manejo y validación de tokens JWT compatible con Node Runtime:

```bash
pnpm add jose
```

---

## 🔑 2. Configuración de Variables de Entorno

Añadir a `.env.local` del satélite:

```bash
# 🔑 Clave compartida con ABDAuth para verificación de JWT (DEBE COINCIDIR)
AUTH_JWT_SECRET=abd-suite-shared-industrial-secret-2026-prod

# 🛰️ Ecosystem Identity Provider (para desarrollo local)
AUTH_PROVIDER_URL=http://localhost:3400
```

---

## 🔑 3. Recepción de Sesión Firmada (Callback Route)

Modificar la ruta de callback federado para almacenar el token JWT firmado de forma directa en lugar de serializar el perfil del usuario en texto plano.

### 📂 Modificar `src/app/api/auth/federated/callback/route.ts`

Localizar la sección donde se guarda la cookie `abd_session` tras recibir la respuesta exitosa del IdP y cambiar la serialización del JSON por el token criptográfico.

> [!IMPORTANT]
> El endpoint `/api/auth/federated/token` de ABDAuth devuelve `{ token, user }` donde `token` es un JWT firmado con HS256 y `user` contiene datos auxiliares (como `branding`) que NO van en el JWT.

```typescript
    const data = await response.json(); // Contiene { token, user }

    // 2. Create the local session storing the cryptographically signed JWT
    const nextResponse = NextResponse.redirect(new URL(state, request.url));
    
    nextResponse.cookies.set('abd_session', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // Turno industrial de 8 horas
    });

    return nextResponse;
```

---

## 🛡️ 4. Módulo Centralizado de Verificación de Token (DRY)

Crear un módulo centralizado que será importado tanto por `session.ts` como por `proxy.ts`, evitando la duplicación de la lógica de verificación.

### 📂 Crear `src/lib/token-verifier.ts`

```typescript
import { jwtVerify, type JWTPayload } from 'jose';

/**
 * 🔑 Resolve the shared ecosystem secret key.
 * Must match AUTH_JWT_SECRET configured in ABDAuth.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET || 'abd-auth-industrial-fallback-secret-2026';
  return new TextEncoder().encode(secret);
}

export interface VerifiedTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  tenantId: string;
  permissions: string[];
  dbPrefix: string;
  isolationStrategy: string;
}

/**
 * 🛡️ Verify JWT signature and expiration.
 * Returns the decoded payload or null if invalid/expired.
 */
export async function verifyToken(token: string): Promise<VerifiedTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as VerifiedTokenPayload;
  } catch {
    return null;
  }
}
```

---

## 🛡️ 5. Validación de Firma Criptográfica (Session Utility)

Modificar el lector de la sesión para descodificar y verificar criptográficamente el token usando la clave del ecosistema.

### 📂 Modificar `src/lib/session.ts`

Reemplazar la implementación de `getIndustrialSession()` para usar el módulo centralizado `token-verifier.ts`:

```typescript
'use server';

import { cookies } from 'next/headers';
import { verifyToken } from './token-verifier';

export interface FederatedSession {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    surname: string;
    role: string;
    tenantId: string;
    dbPrefix: string;
    isolationStrategy: string;
    permissions: string[];
  };
}

export async function getIndustrialSession(): Promise<FederatedSession> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('abd_session');
  
  if (!sessionCookie?.value) {
    return { authenticated: false };
  }

  const payload = await verifyToken(sessionCookie.value);
  if (!payload) {
    console.warn('[SESSION_CRYPTO_VERIFICATION_FAILED]');
    return { authenticated: false };
  }

  return {
    authenticated: true,
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      surname: payload.surname,
      role: payload.role,
      tenantId: payload.tenantId,
      dbPrefix: payload.dbPrefix,
      isolationStrategy: payload.isolationStrategy,
      permissions: payload.permissions || [],
    }
  };
}
```

---

## 🚧 6. Guardia Cruzada de Dominios (Proxy Guard)

Adaptar el proxy para que valide criptográficamente el token antes de aplicar la lógica de ruteo e impida la contaminación de sesión entre subdominios.

### 📂 Modificar `src/proxy.ts`

#### A. Importación del Módulo Centralizado
```typescript
import { verifyToken } from './lib/token-verifier';
```

#### B. Modificación del Flujo de Intercepción del Proxy Guard
Actualizar el bloque de validación de sesión para verificar criptográficamente el token:

```typescript
  // 4. Session Validation via cryptographic JWT verification
  const sessionCookie = request.cookies.get('abd_session');
  let isAuthenticated = false;
  let didVerifyThisRequest = false;
  let userProfile: { email: string; tenantId: string } | null = null;

  if (sessionCookie?.value) {
    const payload = await verifyToken(sessionCookie.value);
    if (payload) {
      isAuthenticated = true;
      userProfile = {
        email: payload.email,
        tenantId: payload.tenantId,
      };
    }
  }

  // 🛡️ Cross-Tenant Security Check: Force re-auth if session tenant doesn't match active subdomain tenant
  if (isAuthenticated && userProfile && tenantInfo) {
    if (userProfile.tenantId !== tenantInfo.tenantId) {
      isAuthenticated = false; // Se descarta la sesión por discrepancia de subdominios
    }
  }
```

---

## 🎨 7. Resolución de Branding sin JWT

El branding del tenant (logo, paleta de colores) **NO se incluye en el JWT** porque es un objeto complejo que inflaría el token. En su lugar, se resuelve mediante la API de subdominios del IdP central.

### 📂 Crear `src/lib/tenant-branding.ts`

Módulo DRY para resolver el branding del tenant activo:

```typescript
import { headers } from 'next/headers';

export interface TenantBranding {
  logoUrl?: string | null;
  theme?: { primary: string; secondary?: string; background?: string; rounded?: boolean; radius?: string; } | null;
}

function getTenantSubdomain(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (subdomain === 'www') return null;
    return subdomain;
  }
  if (parts.length === 2 && parts[1] === 'localhost') return parts[0];
  return null;
}

export async function resolveTenantBranding(): Promise<TenantBranding | null> {
  const headersList = await headers();
  const host = headersList.get('host');
  const subdomain = getTenantSubdomain(host);
  if (!subdomain) return null;

  try {
    const providerUrl = process.env.AUTH_PROVIDER_URL || 'https://abd-auth.vercel.app';
    const res = await fetch(`${providerUrl}/api/auth/tenant/info?subdomain=${subdomain}`, {
      next: { revalidate: 3600 }
    } as RequestInit & { next?: { revalidate: number } });
    if (res.ok) {
      const data = await res.json() as { branding: TenantBranding | null };
      return data.branding;
    }
  } catch (err) {
    console.error('[TENANT_BRANDING_RESOLUTION_ERROR]', err);
  }
  return null;
}
```

### 📂 Consumo en Layouts

- **Root Layout** (`src/app/layout.tsx`): Importar `resolveTenantBranding()` para inyectar `TenantBrandingStyle`.
- **Locale Layout** (`src/app/[locale]/layout.tsx`): Importar `resolveTenantBranding()` y pasar `branding?.logoUrl` como prop al `SidebarNavigation`.

---

## 🗄️ 8. Aislamiento Físico de Consultas de Base de Datos

Todas las consultas en controladores y Server Actions que recuperen, modifiquen o creen datos específicos de un Tenant deben forzar el filtrado por el identificador del Tenant del usuario activo.

Ejemplo en Server Action:
```typescript
export async function getExams() {
  const user = await ensureIndustrialAccess();
  // El filtro tenantId es estrictamente obligatorio para aislar datos
  const exams = await Exam.find({ tenantId: user.tenantId });
  return exams;
}
```

---

## 🏁 9. Plan de Verificación Técnica

1. **Compilación y Tipado**:
   * Asegurar que no hay errores de TypeScript o dependencias:
     ```powershell
     pnpm run tsc
     pnpm run build
     pnpm run full-audit
     ```
2. **Prueba de Inyección Manual (Vulnerabilidad)**:
   * Abrir el navegador e intentar editar manualmente el valor de la cookie `abd_session` introduciendo un JSON plano arbitrario (ej. `{"email":"suplantador@test.com","tenantId":"academia-alfa"}`).
   * Recargar el sitio. La aplicación debe rechazar la cookie inmediatamente, borrarla y redirigir al portal de SSO, certificando la inmunidad del sistema.
3. **Prueba de Guardia Cruzada**:
   * Iniciar sesión en `academia-alfa.quiz.localhost`.
   * Intentar navegar a `academia-beta.quiz.localhost` manteniendo la misma pestaña.
   * El proxy guard debe detectar que el `tenantId` del token (`academia-alfa`) no coincide con el del subdominio (`academia-beta`), invalidar la sesión y redirigir al portal SSO.
4. **Prueba de Expiración**:
   * Verificar que tras 2 horas de inactividad, el JWT caduca y la sesión se invalida automáticamente.

---

## 📋 Contenido del JWT (SsoPayload)

Para referencia, el JWT emitido por ABDAuth contiene los siguientes claims:

| Claim | Tipo | Descripción |
|---|---|---|
| `sub` | `string` | ID único del usuario |
| `email` | `string` | Email del usuario |
| `name` | `string` | Nombre del usuario |
| `surname` | `string` | Apellido del usuario |
| `role` | `string` | Rol activo (ADMIN, SUPER_ADMIN, USER, etc.) |
| `tenantId` | `string` | Identificador del tenant activo |
| `permissions` | `string[]` | Permisos granulares de la aplicación |
| `dbPrefix` | `string` | Prefijo de base de datos para aislamiento |
| `isolationStrategy` | `string` | Estrategia de aislamiento (COLLECTION_PREFIX, etc.) |
| `iat` | `number` | Fecha de emisión (automático) |
| `exp` | `number` | Fecha de expiración: 2 horas (automático) |

> [!WARNING]
> El campo `branding` (logo, tema) **NO se incluye en el JWT**. Se resuelve por la API de subdominios del IdP central usando `resolveTenantBranding()`.
