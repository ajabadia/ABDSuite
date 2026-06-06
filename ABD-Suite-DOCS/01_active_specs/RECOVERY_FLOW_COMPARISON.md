# 🔐 Análisis Comparativo: Flujo de Recovery — Custom vs Better Auth Native

**Fecha:** 2026
**Propósito:** Documentar línea por línea qué cambiaría si se migrara el flujo de recuperación de clave de la implementación personalizada actual a las APIs nativas de Better Auth (`^1.6.11`).

---

## 📊 Resumen Ejecutivo

| Métrica | Custom (Actual) | Better Auth Native |
|---|---|---|
| Líneas de código (server) | ~145 (recovery-actions.ts) | ~15 (config hooks) |
| Dependencias extra | 5 repositorios, 3 servicios | Ninguna (BA incluye) |
| Tests existentes | 38 en ABDAuth | Habría que actualizar ~10 |
| Funcionalidades cubiertas | **12** | **6** (sin auditoría SOC2, sin rate limiting granular, sin notificaciones) |
| Días estimados de migración | — | 5-7 días hábiles |

**Recomendación:** NO migrar. La implementación custom cubre requerimientos SOC2 y de seguridad que Better Auth nativo no ofrece.

---

## 🏗️ Arquitectura Actual (Custom)

### Componentes involucrados

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO CUSTOM ACTUAL                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  forgot-password/page.tsx  ──►  recovery-actions.ts          │
│       (UI formulario email)        │                         │
│                                    ├── RateLimitService      │
│                                    ├── UserRepository        │
│                                    ├── ResetTokenRepository  │
│                                    ├── EmailService (Resend) │
│                                    ├── AuditRepository       │
│                                    │                         │
│  reset-password/page.tsx    ──►  recovery-actions.ts         │
│       (Form con token)             │                         │
│       └── ResetPasswordForm.tsx    ├── ResetTokenRepository  │
│                                    ├── UserRepository        │
│                                    ├── SessionService        │
│                                    ├── EmailService (Resend) │
│                                    └── AuditRepository       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Archivos involucrados

| Archivo | Líneas | Propósito | Dependencia |
|---|---|---|---|
| `recovery-actions.ts` | ~145 | Server Actions (request + reset) | `UserRepository`, `ResetTokenRepository`, `AuditRepository`, `EmailService`, `RateLimitService`, `SessionService` |
| `ResetTokenRepository.ts` | ~45 | CRUD MongoDB de tokens | `BaseRepository`, colleción `reset_tokens` |
| `RateLimitService.ts` | ~45 | Rate limiting por IP | `RateLimitRepository`, `next/headers` |
| `RateLimitRepository.ts` | ~50 | Persistencia MongoDB de contadores | `BaseRepository`, colección `rate_limits` |
| `EmailService.ts` | ~65 | Envío de emails (Recovery + Alertas Seguridad) | `Resend` client |
| `EmailTemplates.ts` | ~90 | Templates HTML de los emails | Ninguna |
| `SessionService.ts` | ~140 | Revocación de sesiones | `SessionRepository` |
| `AuditRepository.ts` | ~85 | Logging SOC2 a ABDLogs | `LogsClient`, colección `central_audit_logs` |
| `forgot-password/page.tsx` | ~120 | UI solicitud recovery | `next-intl`, `recovery-actions` |
| `reset-password/page.tsx` | ~100 | UI reset password | `next-intl`, `recovery-actions` |
| `ResetPasswordForm.tsx` | ~120 | Formulario de nueva contraseña | `lucide-react`, `next-intl` |

---

## 🆕 Alternativa: Better Auth Native

### Configuración necesaria en `auth.ts`

```typescript
// 📍 src/lib/auth.ts
// LO QUE HABRÍA QUE AÑADIR/REEMPLAZAR:

export const auth = betterAuth({
  // ... configuración existente ...

  emailAndPassword: {
    enabled: true,
    // ✅ NUEVO: Callback para enviar email de recovery
    sendResetPassword: async ({ user, url }) => {
      await EmailService.sendPasswordReset({
        to: user.email,
        userName: user.name || user.email.split('@')[0],
        resetUrl: url,  // ← BA genera la URL con el token firmado
      });
    },
  },

  // ✅ NUEVO: Rate limiting (BA built-in)
  rateLimit: {
    window: 3600,  // 1 hour
    max: 3,        // 3 requests per window
  },

  // ⚠️ NUEVO: Advanced config (verificar si BA v1.6 lo soporta)
  advanced: {
    // BA maneja tokens internamente, no hay control sobre:
    // - Algoritmo de hashing (no es Argon2)
    // - Invalidación de tokens previos
    // - Prevención de email enumeration
    // - Revocación de sesiones post-reset
    // - Notificación de seguridad
  },
});
```

### Server Actions que reemplazarían a `recovery-actions.ts`

`recovery-actions.ts` se reemplazaría con:

```typescript
'use server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// 🔁 REEMPLAZA requestPasswordResetAction (45 líneas → 10 líneas)
export async function requestPasswordResetAction(email: string) {
  try {
    await auth.api.forgetPassword({
      body: {
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login/reset-password`,
      },
    });
    return { success: true };
  } catch {
    // ❌ BA nativo podría lanzar error si el email no existe (enumeration)
    return { success: false, error: 'REQUEST_FAILED' };
  }
}

// 🔁 REEMPLAZA resetPasswordAction (60 líneas → 8 líneas)
export async function resetPasswordAction(token: string, newPass: string) {
  try {
    await auth.api.resetPassword({
      body: {
        newPassword: newPass,
        token,
      },
    });
    return { success: true };
  } catch {
    return { success: false, error: 'INVALID_OR_EXPIRED_TOKEN' };
  }
}
```

---

## 🔬 Comparación Línea por Línea

### 1. Token Generation & Storage

| Aspecto | Custom | Better Auth | Impacto |
|---|---|---|---|
| Algoritmo | `crypto.randomBytes(32).toString('hex')` | JWT firmado internamente | Neutral |
| Storage | MongoDB (`reset_tokens` collection) | Interno (posiblemente DB o JWT stats) | ⚠️ Se pierde trazabilidad |
| Expiración | 1 hora, explícita | Configurable, interna | Neutral |
| Invalidación previa | ✅ `invalidateTokens()` antes de crear nuevo | ❌ No invalida tokens anteriores | ⚠️ Múltiples tokens activos |
| Marcado usado | ✅ `markAsUsed()` explícito | ✅ Interno | Neutral |
| **Líneas de código** | **~25** | **0** (automático) | ✅ Menos código |

### 2. Rate Limiting

| Aspecto | Custom | Better Auth | Impacto |
|---|---|---|---|
| Implementación | `RateLimitService.check(ip, 'recovery', 3, 3600)` | `rateLimit.max: 3, window: 3600` | ✔️ Similar |
| Storage | MongoDB (`rate_limits` collection) | Interno | Neutral |
| Granularidad | Por IP + tipo (`login`/`recovery`/`api`) | Global | ⚠️ Menos granular |
| Error devuelto | `TOO_MANY_REQUESTS` (string) | HTTP 429 | Requiere adaptar UI |
| **Líneas de código** | **~50** (servicio + repositorio) | **1** (config) | ✅ Menos código |

### 3. Email Delivery

| Aspecto | Custom | Better Auth | Impacto |
|---|---|---|---|
| Template HTML | Custom en `EmailTemplates.ts` | Debes proveerlo | Igual |
| Proveedor | Resend | Resend (tu código en callback) | Igual |
| Integración | Llamada directa en action | Callback `sendResetPassword` | Similar |
| **Líneas de código** | **~65** (EmailService) | **~15** (callback en auth.ts) | ✅ Menos código |

### 4. Auditoría SOC2

| Aspecto | Custom | Better Auth | Impacto ⚠️ |
|---|---|---|---|
| Evento `PASSWORD_CHANGE_REQUEST` | ✅ `auditRepository.create()` | ❌ No disponible | **PÉRDIDA CRÍTICA** |
| Evento `PASSWORD_CHANGE` | ✅ `auditRepository.create()` | ❌ No disponible | **PÉRDIDA CRÍTICA** |
| Integración ABDLogs | ✅ LogsClient → central_audit_logs | ❌ No integrable | **PÉRDIDA CRÍTICA** |
| **Líneas de código** | **~20** | **0** | ❌ Se pierde compliance |

### 5. Session Revocation Post-Reset

| Aspecto | Custom | Better Auth | Impacto ⚠️ |
|---|---|---|---|
| Revocación global | ✅ `SessionService.revokeAllUserSessions()` | ❌ No documentado | **PÉRDIDA CRÍTICA** |
| Revocación por token | ✅ Invalida sesiones viejas | ❌ No disponible | **RIESGO DE SEGURIDAD** |
| **Líneas de código** | **~10** (try/catch con import dinámico) | **0** | |

### 6. Security Alert Notification

| Aspecto | Custom | Better Auth | Impacto ⚠️ |
|---|---|---|---|
| Email post-cambio | ✅ `EmailService.sendSecurityAlert()` | ❌ No disponible | Pérdida de UX |
| Detalle del evento | ✅ `"Tu contraseña ha sido restaurada..."` | ❌ No disponible | Pérdida de UX |
| **Líneas de código** | **~15** | **0** | |

### 7. Anti-Email Enumeration

| Aspecto | Custom | Better Auth | Impacto |
|---|---|---|---|
| ¿Revela existencia? | ❌ No: retorna `{ success: true }` siempre | ✅ En BA v1.6, `forgetPassword` retorna éxito incluso si no existe (por diseño) | Neutral hoy, pero no garantizado en versiones futuras de BA |
| **Líneas de código** | **~5** | **0** | |

### 8. Password Hashing

| Aspecto | Custom | Better Auth | Impacto |
|---|---|---|---|
| Algoritmo | Argon2 (configurable vía `argon2.hash()`) | Interno (desconocido, probablemente bcrypt) | ❌ Se pierde control |
| Iteraciones | Configurables | Fijas | ❌ Menor flexibilidad |

### 9. UI Components

| Aspecto | Custom | Better Auth | Impacto |
|---|---|---|---|
| UI existente | ✅ 3 componentes | ❌ No provee UI | Neutral (se reusa) |
| Cambio necesario | ❌ Ninguno | ⚠️ Adaptar server actions | Bajo impacto |

### 10. Error Format (UI Compatibility)

| Aspecto | Custom | Better Auth | Impacto ⚠️ |
|---|---|---|---|
| Formato error | `{ success: false, error: 'INVALID_OR_EXPIRED_TOKEN' }` | Excepción HTTP con código distinto | **ROMPE UI** |
| Parseo en UI | `result.error === 'INVALID_OR_EXPIRED_TOKEN'` | Necesita wrapper de adaptación | **ROMPE UI** |
| **Líneas de código** | **~5** (parseo en page.tsx) | **~15** (wrapper adaptador) | ⚠️ Más código del estimado |

> La UI actual parsea códigos de error específicos (`INVALID_OR_EXPIRED_TOKEN`, `USER_NOT_FOUND`, `TOO_MANY_REQUESTS`). Con BA, estos códigos cambiarían, requiriendo un wrapper en `resetPasswordAction` para traducir excepciones de BA al formato esperado por la UI.

### 11. i18n Keys

| Aspecto | Custom | Better Auth | Impacto |
|---|---|---|---|
| Claves | ✅ `login.request_reset.*` y `login.reset_password.*` | ❌ No provee i18n | Neutral (se reusan) |
| Cambio necesario | ❌ Ninguno | ❌ Ninguno | Sin cambio |

---

## 📋 Inventario de lo que se PIERDE con la migración

| # | Funcionalidad | Archivos a eliminar | Justificación SOC2 |
|---|---|---|---|
| 1 | **Auditoría de eventos `PASSWORD_CHANGE_REQUEST`** | `AuditRepository.ts` (parcial) | ❌ Pérdida de compliance SOC2 |
| 2 | **Auditoría de eventos `PASSWORD_CHANGE`** | `AuditRepository.ts` (parcial) | ❌ Pérdida de compliance SOC2 |
| 3 | **Revocación global de sesiones post-reset** | `SessionService.ts` (parcial) | 🚨 **Riesgo de seguridad crítica** |
| 4 | **Notificación de seguridad al usuario** | `EmailService.ts` (parcial) | ❌ Pérdida de UX y transparencia |
| 5 | **Invalidación de tokens previos** | `ResetTokenRepository.ts` (parcial) | ⚠️ Multi-token activo |
| 6 | **Control sobre algoritmo de hashing** | `argon2` dependency | ⚠️ Menor flexibilidad |
| 7 | **Prevención de email enumeration** | `recovery-actions.ts` | ⚠️ Riesgo de seguridad |

### Archivos que se podrían ELIMINAR totalmente

| Archivo | Líneas | ¿Eliminable? |
|---|---|---|
| `ResetTokenRepository.ts` | ~45 | ✅ Sí (BA gestiona tokens internamente) |
| `RateLimitRepository.ts` | ~50 | ✅ Sí (si se usa rate limit de BA) |
| `RateLimitService.ts` | ~45 | ✅ Sí (si se usa rate limit de BA) |
| `recovery-actions.ts` | ~145 | ✅ Sí (reemplazado por BA APIs) |

### Archivos que REQUERIRÍAN MODIFICACIÓN

| Archivo | Cambio |
|---|---|
| `EmailService.ts` | Mantener, mover lógica al callback `sendResetPassword` de BA |
| `EmailTemplates.ts` | Mantener, reutilizar en callback |
| `forgot-password/page.tsx` | Mínimo: cambiar import de server action (misma interfaz) |
| `reset-password/page.tsx` | Mínimo: cambiar import de server action (misma interfaz) |
| `ResetPasswordForm.tsx` | Sin cambios |
| `auth.ts` | ✅ **Añadir** `emailAndPassword.sendResetPassword` + `rateLimit` |
| `AuditRepository.ts` | ❌ **No se puede eliminar** — Se necesita para otros eventos |
| `SessionRepository.test.ts` | ❌ No se elimina — pero requiere actualización si cambia revocación |
| `UserRepository.test.ts` | ❌ No se elimina — verificar que los tests de update de password sigan pasando |

### Archivos que NO CAMBIAN

| Archivo | Razón |
|---|---|
| `UserRepository.ts` | Se sigue usando para otras operaciones |
| `SessionService.ts` | Se sigue usando para gestión de sesiones (excepto revocación post-reset) |
| `AuditRepository.ts` | Se sigue usando para otros eventos de auditoría |
| `i18n messages` | Las claves UI no cambian |
| `ResetPasswordForm.tsx` | La UI es la misma, solo cambia la action |
| `forgot-password/page.tsx` | La UI es la misma, solo cambia la action |

---

## 📐 Matriz de Decisión: Migrar o No Migrar

### Peso de cada factor (1-10)

| Factor | Peso | Custom Score | BA Score |
|---|---|---|---|
| Compliance SOC2 (auditoría) | 10/10 | 🟢 10/10 | 🔴 0/10 |
| Seguridad (revocación, anti-enumeration) | 10/10 | 🟢 10/10 | 🟡 5/10 |
| Mantenibilidad | 7/10 | 🟡 6/10 | 🟢 9/10 |
| Código a cargo (líneas) | 5/10 | 🟡 5/10 | 🟢 9/10 |
| Curva de aprendizaje | 6/10 | 🟢 8/10 | 🟡 6/10 |
| Personalización (Argon2, alertas) | 8/10 | 🟢 10/10 | 🔴 2/10 |

**Puntaje ponderado:**
- **Custom:** 10×10 + 10×10 + 7×6 + 5×5 + 6×8 + 8×10 = **100 + 100 + 42 + 25 + 48 + 80 = 395**
- **Better Auth:** 10×0 + 10×5 + 7×9 + 5×9 + 6×6 + 8×2 = **0 + 50 + 63 + 45 + 36 + 16 = 210**

**📊 Veredicto: Custom gana 395 vs 210.** No migrar.

---

## 🧩 Blueprint Híbrido (para referencia futura)

> ⚠️ **No implementar esta estrategia hoy.** Este blueprint existe solo como referencia si en el futuro se decide migrar parcialmente.

Si hipotéticamente se quisiera reducir deuda técnica sin perder funcionalidades críticas:

### Conservar (no migrar a BA)
- Auditoría SOC2 (`AuditRepository`)
- Revocación de sesiones post-reset (`SessionService`)
- Notificación de seguridad (`EmailService.sendSecurityAlert`)
- Anti-email enumeration
- Argon2 hashing

### Sí se podría migrar a BA
- Token generation/storage (BA lo maneja bien)
- Rate limiting (BA built-in es suficiente)
- Email delivery callback (BA lo simplifica)

### ⚠️ Riesgo de la vía híbrida

Activar `sendResetPassword` en la configuración de BA **crearía un segundo canal de recovery** que compite con el custom, generando:
- Tokens duplicados (uno de BA, uno custom)
- Confusión en el usuario (dos emails de recovery)
- Auditoría incompleta (eventos de BA no registrados en ABDLogs)

Por esta razón, **no implementar la vía híbrida**.

---

## 🏁 Conclusión Final

La implementación custom actual en `recovery-actions.ts` es superior en **todos los aspectos críticos** (seguridad, compliance, personalización). Migrar a Better Auth nativo implicaría:

| Aspecto | Impacto |
|---|---|
| Compliance SOC2 | 🔴 Pérdida total de trazabilidad de eventos de recovery |
| Seguridad | 🔴 Sin revocación de sesiones, posible email enumeration |
| Código eliminado | ✅ ~240 líneas menos (repositorios de tokens y rate limiting) |
| Código añadido | ⚠️ ~30 líneas en auth.ts (config de BA) + adaptación de actions |
| Mantenimiento futuro | ⚠️ Dependencia de BA para features críticas de seguridad |

**Decisión: Mantener la implementación custom. No migrar.**

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/DISENO_SSO_TENANTS.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/ABDAuth.md]]
