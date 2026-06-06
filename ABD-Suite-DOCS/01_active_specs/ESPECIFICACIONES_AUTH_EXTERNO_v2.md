# 📋 Especificaciones Técnicas: Integración de Auth Externo y Recuperación de Clave — v2 (Corregida)

**Versión:** 2.1 — Corregida post-revisión de código
**Target:** Better Auth `^1.6.11` (instalado en ABDAuth)
**Cambios vs v1:** Sección 3 reescrita (recovery existente), nueva §3.1 (Account Linking), hooks corregidos, claves i18n añadidas, iconos sociales corregidos, sección 5 (callbackUrl) añadida.

---

## 🎯 Objetivo General
Habilitar el inicio de sesión federado (Social Login) asignando a los usuarios nuevos un **Tenant Temporal** por defecto, y documentar el flujo completo de **Recuperación de Clave (Password Recovery)** — que **ya está implementado** en el código base y debe preservarse.

---

## 🚦 Estado de la Implementación (Auditoría de Código)

| Sección / Especificación | Estado | Observaciones |
| :--- | :--- | :--- |
| **1. Proveedores Sociales en Better Auth** | `HECHO ✅` | `socialProviders` configurado con Google/GitHub/Microsoft en [auth.ts](file:///d:/desarrollos/ABDSuite/ABDAuth/src/lib/auth.ts). Env vars placeholder en `.env.local`. |
| **2. Asignación de Tenant Temporal** | `HECHO ✅` | Hook `databaseHooks.user.create.before` implementado con defaults y ternarios `typeof` en [auth.ts](file:///d:/desarrollos/ABDSuite/ABDAuth/src/lib/auth.ts). |
| **2.1. Account Linking** | `HECHO ✅` | `account.accountLinking` con `enabled: true` y `trustedProviders` configurado en [auth.ts](file:///d:/desarrollos/ABDSuite/ABDAuth/src/lib/auth.ts). |
| **3. Recuperación de Clave (Password Recovery)** | `HECHO ✅` | Implementada mediante Server Actions y endpoints tradicionales; no tocar. `NEXT_PUBLIC_APP_URL` añadido como fallback. |
| **4. Directrices de Interfaz (Chasis Tech-Noir)** | `HECHO ✅` | Botones sociales con SVG embebidos, divisor i18n, spinner por proveedor, toast de error, `callbackURL` preservado. Traducido en `es.json`/`en.json`. |
| **5. Flujo de callbackUrl** | `HECHO ✅` | Frontend envía `callbackURL` vía `authClient.signIn.social()`. Better Auth configurado para procesar el redirect. Proxy.ts maneja `callbackUrl` en satélites. |
| **Task 7.1 (Passkeys)** | `PENDIENTE ❌` | Integración biométrica futura. |
| **Task 7.2 (Gestión de Sesiones)** | `HECHO ✅` | La consola `/dashboard/security` ya tiene `SessionManager` operativo. |
| **Task 7.3 (SSO SAML/OIDC)** | `PENDIENTE ❌` | Integración enterprise futura. |
| **Task 7.4 (Bloqueo de Cuentas)** | `PARCIAL ⚠️` | Campos soportados en base de datos; lógica de bloqueo por fuerza bruta requiere refinamiento. |
| **Task 7.5 (Telemetría SOC2)** | `HECHO ✅` | Integrado con `ABDLogs`. |
| **Task 7.6 (Perfil Centralizado)** | `PARCIAL ⚠️` | Seguridad y sesiones ya operativas; campos personales (nombre, avatar) pendientes de migrar de `ABDAgRAG`. |

---

## 📚 Documentos de Referencia a Considerar
El equipo externo debe leer y respetar los siguientes documentos del repositorio antes de iniciar el desarrollo:

1. **Guía de Estilos Visuales**: [STYLE_GUIDE.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/STYLE_GUIDE.md) — Define los estándares estéticos *Tech-Noir / Abisal* (paletas HSL, bordes rectos `rounded-none`, grain, etc.).
2. **Hoja de Ruta General**: [ROADMAP.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/ROADMAP.md) — Para entender el contexto de las fases y dependencias.
3. **Especificaciones de Desarrollo Unificado**: [PROMPT_UNIFICADO_DESARROLLO.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/PROMPT_UNIFICADO_DESARROLLO.md) — Reglas y restricciones de calidad estricta (no variables `any` en TypeScript, uso de `next-intl` para traducciones, etc.).
4. **Auditoría de Auth**: [auditoria.md de ABDAuth](file:///d:/desarrollos/ABDSuite/ABDAuth/auditoria.md) — Describe decisiones arquitectónicas previas y parches de seguridad críticos que no se deben romper.
5. **Auditoría del SDK Satélite**: [auditoria.md de ABDSatelliteSDK](file:///d:/desarrollos/ABDSuite/ABDSatelliteSDK/auditoria.md) — Para asegurar la compatibilidad con el sistema de sesiones y el enmascaramiento de PII.

---

## 🌐 1. Configuración de Proveedores Sociales en Better Auth [PENDIENTE ❌]
En el backend de `ABDAuth` ([src/lib/auth.ts](file:///d:/desarrollos/ABDSuite/ABDAuth/src/lib/auth.ts)), el equipo debe activar los proveedores dentro de la propiedad `socialProviders`:

```typescript
// Ubicación: src/lib/auth.ts
export const auth = betterAuth({
  // ... configuración existente (base de datos, etc)
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      // Tenant ID de Microsoft Azure (opcional, por defecto 'common')
      // Para cuentas Microsoft personales (live.com, outlook.com): "consumers"
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
    }
  },
  // ...
});
```

### Variables de Entorno Requeridas en `.env.local` de ABDAuth
```env
# Ubicación: ABDAuth/.env.local

GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret

MICROSOFT_CLIENT_ID=tu_microsoft_client_id
MICROSOFT_CLIENT_SECRET=tu_microsoft_client_secret
# Opcional: "common" (multi-tenant), "consumers" (personales), o tenant-id específico
MICROSOFT_TENANT_ID=common
```

> **⚠️ Nota importante sobre Microsoft:** El valor `"common"` funciona para Azure AD multi-tenant (cuentas corporativas/educativas). Para cuentas Microsoft personales (Outlook.com, Live.com), usar `"consumers"`. Si necesitas ambos, configura el proveedor Microsoft dos veces o usa `"common"` que redirige a Azure AD por defecto.

---

## 🏢 2. Lógica de Asignación a Tenant Temporal [PENDIENTE ❌]
El modelo de identidad de la suite ABD requiere obligatoriamente los campos `tenantId`, `role`, `dbPrefix` e `isolationStrategy` en la entidad `User`, definidos en `src/lib/auth.ts` como `additionalFields`.

Cuando un usuario se loguea por primera vez con un proveedor externo, Better Auth creará el registro del usuario. Se debe usar el hook `databaseHooks.user.create.before` de Better Auth para interceptar la creación y poblar los campos obligatorios del **Tenant Temporal**.

> ✅ **Confirmado para BA v1.6:** En Better Auth `^1.6.11` (versión instalada en ABDAuth), `databaseHooks.user.create.before` **sí se dispara** tanto para registro email/password como para creación de usuario vía OAuth social. No se requiere un hook separado.

```typescript
// Configuración propuesta en hooks de Better Auth (src/lib/auth.ts)
export const auth = betterAuth({
  // ...
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Los proveedores sociales pueden no incluir todos los campos industriales
          return {
            data: {
              ...user,
              role: user.role || "USER",
              // Asignación de tenant temporal por defecto
              tenantId: user.tenantId || "temp-tenant",
              dbPrefix: user.dbPrefix || "temp",
              isolationStrategy: user.isolationStrategy || "COLLECTION_PREFIX",
              // Valores por defecto para campos booleanos/number
              active: typeof user.active === 'boolean' ? user.active : true,
              mfaEnabled: typeof user.mfaEnabled === 'boolean' ? user.mfaEnabled : false,
              mfaEnforced: typeof user.mfaEnforced === 'boolean' ? user.mfaEnforced : false,
              mfa_verified: typeof user.mfa_verified === 'boolean' ? user.mfa_verified : false,
              // Control de intentos de login (ya definido en additionalFields)
              loginAttempts: typeof user.loginAttempts === 'number' ? user.loginAttempts : 0,
            }
          };
        }
      }
    }
  }
});
```

> **⚠️ Nota sobre campos booleano/numéricos:** Better Auth puede pasar `undefined` para campos opcionales. Usar operadores ternarios evita que `undefined` sobreescriba los defaults de la base de datos.

### 🆕 2.1. Post-Creación: Vinculación de cuenta social (Account Linking) [PENDIENTE ❌]

Cuando un usuario existe con email/password y luego inicia sesión con un proveedor social (mismo email), Better Auth **no vincula automáticamente** las cuentas. Se deben configurar dos cosas:

```typescript
// En src/lib/auth.ts — configuración de account linking
export const auth = betterAuth({
  // ...
  account: {
    modelName: "accounts",
    // ⚠️ ¡CRÍTICO! Permite que un usuario vincule múltiples cuentas sociales
    accountLinking: {
      enabled: true,
      // Criterio de vinculación: confiar en el email verificado del proveedor
      trustedProviders: ["google", "github", "microsoft"],
    },
  },
  // ...
});
```

**Comportamiento:**
1. Usuario se registra con email `user@mail.com` y contraseña
2. Usuario luego hace login con Google (mismo email `user@mail.com`)
3. Better Auth detecta el email duplicado y **vincula** la cuenta de Google al usuario existente
4. El usuario puede usar cualquiera de los dos métodos para autenticarse

**Riesgo de seguridad:** Solo habilitar `accountLinking` con proveedores que verifican el email (Google, GitHub, Microsoft lo hacen). No habilitar para proveedores que no verifican.

---

## 🔐 3. Flujo de Recuperación de Clave (Password Recovery) [HECHO ✅]

> **⚠️ IMPORTANTE:** ABDAuth **ya tiene una implementación completa, auditada y productiva** del flujo de recuperación de clave. **NO migrar a las APIs nativas de Better Auth** (`auth.api.forgetPassword`, `auth.api.resetPassword`). La implementación existente incluye funcionalidades críticas que Better Auth no proporciona.

### Ubicación de la implementación existente

| Archivo | Propósito |
|---|---|
| `src/services/auth/recovery-actions.ts` | Server Actions: `requestPasswordResetAction()` y `resetPasswordAction()` |
| `src/lib/repositories/ResetTokenRepository.ts` | Persistencia de tokens de recuperación en MongoDB |
| `src/services/email/EmailService.ts` | Envío de emails vía Resend |
| `src/services/email/templates/EmailTemplates.ts` | Templates HTML de los emails |
| `src/services/security/RateLimitService.ts` | Rate limiting por IP en solicitudes de recovery |
| `src/services/auth/SessionService.ts` | Revocación global de sesiones post-reset |
| `src/app/[locale]/login/forgot-password/page.tsx` | UI de solicitud de recuperación |
| `src/app/[locale]/login/reset-password/components/ResetPasswordForm.tsx` | UI de restablecimiento de contraseña |

### Funcionalidades que la implementación existente cubre (y Better Auth no)

| Funcionalidad | Implementación existente | Better Auth API |
|---|---|---|
| Rate limiting (3 req/hora por IP) | ✅ `RateLimitService.check()` vía IP | ❌ No incluye |
| Prevención de email enumeration | ✅ Retorna `{ success: true }` aunque no exista el usuario | ❌ Podría revelar existencia |
| Auditoría SOC2 (eventos inmutables) | ✅ `auditRepository.create()` con `PASSWORD_CHANGE_REQUEST` / `PASSWORD_CHANGE` | ❌ No audita |
| Revocación global de sesiones post-reset | ✅ `SessionService.revokeAllUserSessions()` | ❌ No revoca sesiones |
| Notificación de seguridad al usuario | ✅ `EmailService.sendSecurityAlert()` tras el cambio | ❌ No notifica |
| Invalidación de tokens previos | ✅ `resetTokenRepository.invalidateTokens()` | ❌ No invalida previos |
| Hashing con Argon2 | ✅ `argon2.hash()` | Interno (no configurable) |

### Paso A: Solicitud de Enlace (Forgot Password) — YA IMPLEMENTADO

1. El usuario introduce su correo en `/login/forgot-password`.
2. Se llama a `requestPasswordResetAction(email)` desde `forgot-password/page.tsx`.
3. El `RateLimitService` verifica el límite de 3 solicitudes/hora por IP.
4. Se genera un token `crypto.randomBytes(32)` con expiración de 1 hora.
5. Se almacena en `ResetTokenRepository` (MongoDB), invalidando tokens anteriores.
6. Se envía el email vía `EmailService.sendPasswordReset()` (Resend).
7. Se registra evento de auditoría `PASSWORD_CHANGE_REQUEST`.

**No se requiere implementación adicional para este paso.**

### Paso B: Restablecimiento de Clave (Reset Password) — YA IMPLEMENTADO

1. El usuario hace clic en el enlace recibido en su email (`/login/reset-password?token=...`).
2. La UI en `ResetPasswordForm.tsx` lee el `token` de los query parameters.
3. Al enviar el formulario, se invoca a `resetPasswordAction(token, newPass)`.
4. La acción:
   - Valida el token contra `ResetTokenRepository`
   - Hashea la nueva contraseña con Argon2
   - Actualiza el usuario en `UserRepository`
   - Marca el token como usado
   - Registra evento de auditoría `PASSWORD_CHANGE`
   - **Revoca TODAS las sesiones activas** del usuario (seguridad crítica)
   - Envía notificación de seguridad al email del usuario

**No se requiere implementación adicional para este paso.**

### ⚙️ Ajuste menor: Actualizar `NEXTAUTH_URL` en recovery-actions.ts

El archivo `recovery-actions.ts` usa:
```typescript
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3400';
```

Esta variable (`NEXTAUTH_URL`) es legacy de NextAuth.js v5. Se recomienda migrar a:
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3400';
```

Y añadir en `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3400
```

---

## 🎨 4. Directrices de Interfaz (Chasis Tech-Noir / Uncodixfy) [HECHO ✅]

### 4.1. Estructura recomendada del LoginForm actualizado

Los botones sociales deben integrarse en el `LoginForm.tsx` existente, debajo del botón de "Autenticar Sistema" y antes del badge SOC2.

```tsx
// Dentro de <form> en LoginForm.tsx, después del botón submit

{/* 🔗 Divisor Social */}
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-border/30" />
  </div>
  <div className="relative flex justify-center">
    <span className="bg-card px-3 text-[8px] font-mono font-black text-muted-foreground uppercase tracking-[0.2em]">
      {t('social.divider')}
    </span>
  </div>
</div>

{/* 🌐 Botones de Proveedores Sociales */}
<div className="grid grid-cols-3 gap-2">
  {SOCIAL_PROVIDERS.map((provider) => (
    <button
      key={provider.id}
      type="button"
      disabled={isLoading}
      onClick={() => handleSocialLogin(provider.id)}
      aria-label={t(`social.${provider.id}`)}
      className="flex items-center justify-center h-10 bg-secondary/20 border border-border rounded-none
                 hover:border-primary/40 hover:bg-secondary/30 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.15)]
                 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin text-muted-foreground" />
      ) : (
        <provider.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      )}
    </button>
  ))}
</div>
```

### 4.2. Iconos de proveedores — SVG embebidos (no lucide-react)

> ⚠️ **Importante:** `lucide-react` **no tiene** iconos de Google, GitHub ni Microsoft. Se deben usar SVG inline o componentes SVG propios.

```tsx
// Ejemplo de mapa de proveedores con SVG embebidos
const SOCIAL_PROVIDERS = [
  {
    id: 'google',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    id: 'github',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
  },
  {
    id: 'microsoft',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <rect x="2" y="2" width="9" height="9" fill="#F25022"/>
        <rect x="13" y="2" width="9" height="9" fill="#7FBA00"/>
        <rect x="2" y="13" width="9" height="9" fill="#00A4EF"/>
        <rect x="13" y="13" width="9" height="9" fill="#FFB900"/>
      </svg>
    ),
  },
];
```

### 4.3. Claves i18n a añadir en los mensajes

Estas claves **no existen actualmente** en `es.json` / `en.json`. Deben añadirse bajo la sección `login`.

> ⚠️ **Verificar colisiones:** Antes de añadir, confirmar que no existe ya una clave `login.social` en los archivos de mensajes. Si existiera, integrar las nuevas claves dentro de la estructura existente en lugar de sobrescribir.

**En `src/messages/es.json`:**
```json
{
  "login": {
    // ... claves existentes ...
    "social": {
      "divider": "o continúa con",
      "google": "Iniciar sesión con Google",
      "github": "Iniciar sesión con GitHub",
      "microsoft": "Iniciar sesión con Microsoft",
      "loading": "Autenticando con proveedor externo..."
    }
  }
}
```

**En `src/messages/en.json`:**
```json
{
  "login": {
    // ... existing keys ...
    "social": {
      "divider": "or continue with",
      "google": "Sign in with Google",
      "github": "Sign in with GitHub",
      "microsoft": "Sign in with Microsoft",
      "loading": "Authenticating with external provider..."
    }
  }
}
```

### 4.4. Manejo del callbackUrl en Social Login

El flujo de login social requiere preservar el `callbackUrl` original a través del redirect OAuth. Se debe implementar en `LoginForm.tsx` o en la página de login:

```tsx
import { authClient } from "@/lib/auth-client"; // ← import necesario
import { useState } from "react";

const [isLoading, setIsLoading] = useState(false);

const handleSocialLogin = async (provider: string) => {
  setIsLoading(true);
  try {
    // Preservar callbackUrl actual en el state de OAuth
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get('callbackUrl') || '/dashboard';
    
    // Better Auth redirige automáticamente al proveedor social
    await authClient.signIn.social({
      provider,
      callbackURL: callbackUrl,
    });
  } catch (error) {
    console.error("Social login failed:", error);
  } finally {
    setIsLoading(false); // ← garantiza que el spinner se desactive siempre
  }
};
```

> **Nota:** Better Auth maneja internamente el redirect OAuth. El `callbackURL` se devuelve al final del flujo para redirigir al usuario a donde intentaba ir originalmente.

---

## 🆕 5. Flujo de callbackUrl Post-Login Social [PARCIAL ⚠️]

Cuando un usuario es redirigido a un proveedor social y luego regresa, el `callbackUrl` original debe preservarse. Better Auth lo maneja mediante el parámetro `callbackURL` en `signIn.social()`.

### Flujo completo:

1. Usuario intenta acceder a `/dashboard` → middleware redirige a `/login?callbackUrl=/dashboard`
2. Usuario hace clic en "Acceso con Google"
3. Se llama a `authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' })`
4. Better Auth redirige a Google, guarda `callbackURL` internamente
5. Google autentica y redirige de vuelta a Better Auth
6. Better Auth completa el login y redirige a `callbackURL`
7. El proxy.ts detecta la sesión activa y permite el acceso

---

## 🔍 6. Plan de Verificación de Calidad

Cualquier cambio realizado debe pasar las siguientes fases de auditoría del pipeline unificado de la suite (`./scripts/abd-audit.ps1`):

- **Cero variables huérfanas o casts `any`** — Verificar con `pnpm tsc` (strict mode).
- **Zero-FOUC** y herencia correcta de estilos Tailwind v4 — Verificar con `pnpm build`.
- **Internacionalización total** de las etiquetas de los nuevos botones — Verificar que las claves `login.social.*` existen en `es.json` y `en.json`.
- **Tests unitarios**: Ejecutar `pnpm test` en ABDAuth para verificar que no se rompe nada.
- **Tests E2E**: Ejecutar `pnpm exec playwright test`.
- **Verificación manual**: Navegar a `/login` y comprobar:
  - Los 3 botones sociales se renderizan con iconos correctos
  - El divisor social aparece con el texto traducido
  - Al hacer clic en un botón social, se muestra el spinner de carga
  - El flujo de login por email/password sigue funcionando

---

## 🚀 7. Pistas e Instrucciones para Tareas de Autenticación Futuras

El equipo de desarrollo externo debe tener en cuenta el siguiente backlog de seguridad e implementar las pautas detalladas a continuación:

### Task 7.1: Inicio de Sesión Biométrico / Passwordless (MFA WebAuthn & Passkeys)
* **Objetivo**: Integrar autenticación por hardware/biometría (FaceID, TouchID, YubiKeys).
* **Pautas**:
  1. Instalar y configurar el plugin `passkey` de Better Auth en `src/lib/auth.ts`:
     ```typescript
     import { passkey } from "better-auth/plugins";
     // ...
     plugins: [
       passkey(),
       // ... otros plugins
     ]
     ```
  2. Implementar en la configuración de perfil del usuario (`/profile` o `/dashboard/settings`) botones para registrar llaves de seguridad usando `authClient.passkey.register()`.
  3. En la interfaz de Login (`/login`), habilitar un botón prominente "Iniciar sesión con Llave de Seguridad" que llame a `authClient.signIn.passkey()`.

### Task 7.2: Consola de Gestión y Revocación de Sesiones Activas
* **Objetivo**: Evitar sesiones concurrentes no deseadas permitiendo la auditoría desde el perfil del usuario.
* **Pautas**:
  1. Utilizar las APIs nativas de Better Auth para listar sesiones activas en un cliente React:
     ```typescript
     const { data: sessions } = await authClient.listSessions();
     ```
  2. Renderizar una tabla o lista de terminales activas detallando: Sistema Operativo, Navegador (derivados de `userAgent`), Fecha de creación, e IP.
  3. Proveer un botón de "Revocar Sesión" para eliminar sesiones individuales llamando a `authClient.revokeSession({ id: sessionId })` y un botón de "Cerrar sesión en todos los demás dispositivos" llamando a `authClient.revokeOtherSessions()`.

### Task 7.3: Integración de Single Sign-On Corporativo (OIDC / SAML Enterprise Bridge)
* **Objetivo**: Permitir a grandes tenants conectar su propio Azure AD / Okta.
* **Pautas**:
  1. Integrar el plugin `saml` o `oidc` en Better Auth.
  2. Diseñar un flujo de redirección dinámica en base al dominio o email introducido por el usuario. Si el usuario ingresa `admin@cliente-corporativo.com`, el login debe identificar el dominio, buscar si tiene SSO habilitado en base de datos y redirigir directamente al endpoint SAML/OIDC configurado para ese tenant.

### Task 7.4: Robustecimiento de la Política de Bloqueo de Cuentas (Account Lockout)
* **Objetivo**: Mitigar ataques de fuerza bruta.
* **Pautas**:
  1. En el flujo de login por contraseña (`loginAction`), auditar y guardar en la colección de usuarios los campos `loginAttempts` y `lockoutUntil`.
  2. Si los intentos fallidos superan un umbral (ej. 5 intentos), establecer `lockoutUntil = Date.now() + 15 * 60 * 1000` (15 minutos).
  3. Durante la verificación, bloquear el login inmediatamente si `lockoutUntil` es una fecha futura, mostrando un aviso descriptivo de cuenta temporalmente bloqueada.

### Task 7.5: Telemetría SOC2 y Envío de Alertas en Caliente a ABDLogs
* **Objetivo**: Garantizar el cumplimiento e inmutabilidad de logs de auditoría ante eventos críticos.
* **Pautas**:
  1. Cada evento de autenticación crítico (Login fallido, Bloqueo de cuenta, Reset de contraseña exitoso/solicitado) debe instanciar el cliente HTTP de `ABDLogs` para registrar un evento.
  2. Asegurarse de enmascarar cualquier PII utilizando el logger estructurado del SDK (`@abd/satellite-sdk`).
  3. Enviar metadatos como `ip`, `userAgent`, y el tipo de evento exacto (`AUTH_LOGIN_FAILED`, `AUTH_LOCKOUT_TRIGGERED`, `AUTH_PASSWORD_RESET_SUCCESS`).

### Task 7.6: Pantalla Centralizada de Perfil de Usuario en ABDAuth (Portabilidad desde ABDAgRAG)
* **Objetivo**: Unificar el panel de gestión del perfil de usuario y configuración de seguridad dentro de `ABDAuth` para todos los satélites.
* **Ubicación de Ruta Recomendada**:
  * Servidor: `src/app/[locale]/dashboard/profile/page.tsx`
  * Cliente: `src/app/[locale]/dashboard/profile/ProfileClient.tsx`
* **Instrucciones para el Equipo Externo**:
  1. **Integración con la Navegación**: Esta ruta hereda de manera automática el `SidebarNavigation` del layout raíz. Se debe registrar el enlace `/dashboard/profile` en las traducciones del menú de navegación.
  2. **Estructura Visual**: Reutilizar el chasis visual y la maquetación atómica probada en la aplicación `ABDAgRAG` (ver archivo de referencia: [ProfileClient.tsx en ABDAgRAG](file:///d:/desarrollos/ABDAgRAG/src/app/(authenticated)/settings/profile/ProfileClient.tsx)):
     * Tarjeta 1: **Información Personal** (nombre, apellido, teléfono) conectada a `authClient.updateUser`.
     * Tarjeta 2: **Seguridad & Credenciales** (formulario de contraseña y configuración de MFA) mapeado con las APIs de Better Auth.
     * Tarjeta 3: **Dispositivos y Sesiones Activas** (Task 7.2).
  3. **White-Labeling**: Cargar el estilo y logotipo dinámicamente mediante el layout del dashboard en base al `tenantId` de la sesión activa del usuario para garantizar Zero-FOUC y adaptación automática de marca.
  4. **Internacionalización (i18n)**: Todos los literales y etiquetas del perfil deben estar contenidos en los namespaces `/src/messages/es.json` y `en.json` (clave `profile.page`).


---

## 📋 Resumen de Cambios Respecto a v1

| Sección | Cambio |
|---|---|
| §3 Recovery Flow | ❌ **Reescrita completamente** — Ahora referencia la implementación existente, no Better Auth APIs |
| §3.1 Account Linking | 🆕 **Nueva sección** — `accountLinking` con `trustedProviders` |
| §2 Tenant Temporal | ✅ Corregido: hook usa ternarios para booleanos/number, no `||` simple |
| §4 UI Icons | ❌ **Corregido**: Eliminada referencia a `lucide-react` (no tiene iconos sociales). Añadidos SVG embebidos |
| §4.3 i18n keys | 🆕 **Nuevas claves** `login.social.*` propuestas |
| §4.4 callbackUrl | 🆕 **Nuevo**: Manejo de `callbackUrl` en social login |
| §5 callbackUrl | 🆕 **Nueva sección**: Flujo completo post-login social |
| General | ✅ Añadida variable `NEXT_PUBLIC_APP_URL` como alternativa a `NEXTAUTH_URL` legacy |

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/RECOVERY_FLOW_COMPARISON.md]]
	* [[01_active_specs/ROADMAP.md]]
	* [[01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/DISENO_SSO_TENANTS.md]]
	* [[02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/ABDAuth.md]]
