# 🔄 Migration Report: Next-Auth → Better Auth ✅ (COMPLETED)

## 🎯 Overview

This document outlines the technical transition from next-auth to Better Auth. The goal is to replace the current unstable beta authentication with a type-safe, modular, and industrial-grade identity system.

## 🏆 Primary Objectives

1. **Eliminate Beta Instability** — next-auth v5 beta is blocking Next.js 16 upgrades
2. **Native MFA** — Replace `MfaService.ts` manual TOTP/QR/backup-codes logic with Better Auth MFA plugin
3. **True Type Safety** — Use schema inference via `inferAdditionalFields` instead of manual `IndustrialUser` type assertions
4. **Enhanced Tenancy** — Use Better Auth Organization plugins for multi-tenant governance

## 🗺️ Architecture Mapping

| Capa Actual (next-auth) | Capa Target (better-auth) | Impacto |
|---|---|---|
| `src/auth.ts` (next-auth config) | `src/lib/auth.ts` (betterAuth instance) | 🔴 Alto |
| `src/proxy.ts` — `auth(fn)` wrapper | `src/proxy.ts` — `auth.api.getSession({ headers })` manual | 🔴 Alto |
| `src/services/auth/MfaService.ts` (manual TOTP/QR) | `authClient.twoFactor.*` plugin (Fase 3 — completado) | 🟡 Medio |
| `IndustrialUser` + `declare module next-auth` | `user.additionalFields` + `inferAdditionalFields` | 🟡 Medio |
| `SessionProvider` (next-auth/react) | `authClient.useSession` (better-auth/react) | 🟡 Medio |
| `src/lib/repositories/MfaRepository.ts` | ❌ Eliminado (better-auth gestiona TOTP internamente) | 🟢 Bajo |

## 🛣️ Roadmap

| Fase | Estado | Descripción |
|---|---|---|
| **Fase 1** | ✅ Completado | Instalar better-auth + MongoDB adapter. Actualizar `.env`. |
| **Fase 2** | ✅ Completado | Definir `IndustrialUser` fields en `betterAuth` config + `twoFactor` plugin + `auth-client.ts` |
| **Fase 3** | ✅ Completado | Habilitar MFA plugin, reescribir `MfaService.ts`, eliminar `MfaRepository.ts`, migrar componentes UI a `authClient.twoFactor.*` |
| **Fase 4** | ✅ Completado | Migrar `proxy.ts`, `SessionProvider`, Satellite SDK al cliente better-auth. Descomisionar next-auth. |

## 🔄 Fase 4: Proxy Migration — EJECUTADA ✅

> **Nota:** Esta sección documenta el plan de migración que se ejecutó. Todo el contenido siguiente es histórico y refleja el *antes/después* de la migración, que ya está completada. Ver `ABDAuth/src/proxy.ts` para la implementación final.

### Arquitectura original (next-auth v5)

```typescript
import { auth } from './auth';   // ← next-auth auth()
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req?.auth;
  const user = req?.auth?.user as IndustrialUser;
  // ...
});
```

Next-auth exportaba un **wrapper de middleware** (`auth(fn)`) que:
1. Leía la cookie de sesión
2. Validaba el JWT/sesión en base de datos
3. Inyectaba `req.auth` en el request
4. Llamaba al callback

### Arquitectura actual (better-auth)

Better-auth **no tiene wrapper mágico**. La sesión se obtiene explícitamente:

```typescript
import { auth } from '@/lib/auth';  // ← better-auth instance

const session = await auth.api.getSession({
  headers: req.headers,
});
```

### Cambios realizados en Fase 4

| Archivo | Cambio aplicado |
|---|---|
| `ABDAuth/src/proxy.ts` | `export default auth((req) => {...})` → `async function proxy(req)` con `getSession()` manual |
| `ABDAuth/src/proxy.ts` | `req?.auth` → `session` (variable local) |
| `ABDAuth/src/proxy.ts` | Runtime se mantiene como el default de Next.js 16 (no requiere `runtime: 'nodejs'` explícito) |
| `ABDAuth/src/proxy.ts` | Import de `@/lib/auth` en vez de `@/auth` |
| `ABDAuth/src/proxy.ts` | Eliminado wrapper `auth()` |
| `ABDAuth/src/app/api/auth/[...all]/route.ts` | Handler `toNextJsHandler` montado en `/api/auth/[...all]` |
| `ABDAuth/src/types/auth.ts` | Eliminado `declare module next-auth`; `IndustrialUser` se mantiene para uso interno |
| Paquetes satélite (`ABDSatelliteSDK`) | Migrados a `withIndustrialAuth()` con flujo federado (JWT + verifySession) en vez de next-auth |

### Detalle: Implementación final de `proxy.ts`

Ver archivo actual: `ABDAuth/src/proxy.ts`

```typescript
export default async function proxy(request: NextRequest) {
  // Manejo de tenantId vía query param
  const queryTenantId = request.nextUrl.searchParams.get("tenantId");
  if (queryTenantId !== null) {
    request.cookies.set("active_tenant_id", queryTenantId);
  }
  // ...
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  // ... MFA enforcement, RBAC, redirects ...
}
```

### Arquitectura federada (satélites)

Las apps satélite (tenantGovernance, ABDQuiz, ABDLogs, ABDAnalytics) **no usan better-auth directamente**. Usan `ABDSatelliteSDK` con:

- `withIndustrialAuth(options)` — middleware que redirige a ABDAuth para login federado
- `getIndustrialSession()` — obtiene la sesión desde el JWT
- `SessionProvider` — contexto React de sesión
- Flujo: ABDAuth emite JWT → satélite valida JWT localmente + verifica expiry contra ABDAuth (con caché de 60s)

## ⚠️ Limitaciones resueltas

- ~~El flujo de verificación MFA durante login (`/login/mfa`) está temporalmente roto~~ → **Resuelto**: better-auth maneja la autenticación completa.
- ~~Usuarios con MFA habilitado no podrán hacer login~~ → **Resuelto**.

## 📌 Notas técnicas

- **DB**: Las colecciones de MongoDB se migraron a la estructura de better-auth.
- **Types**: Se usa `inferAdditionalFields<typeof auth>()` de better-auth.
- **Runtime**: El proxy funciona con el runtime por defecto de Next.js 16 (no requiere `runtime: 'nodejs'` explícito).

## ✅ Definition of Done (todo completado)

- [x] Login/Logout funciona con better-auth
- [x] MFA funciona nativamente (setup, verify, backup codes)
- [x] IndustrialUser properties tienen tipos TS completos vía `inferAdditionalFields`
- [x] `proxy.ts` usa `getSession()` de better-auth sin wrapper
- [x] Paquetes satélite identifican correctamente al usuario
- [x] next-auth descomisionado — dependencia eliminada de `package.json`
- [x] `src/app/api/auth/[...nextauth]/route.ts` eliminado
