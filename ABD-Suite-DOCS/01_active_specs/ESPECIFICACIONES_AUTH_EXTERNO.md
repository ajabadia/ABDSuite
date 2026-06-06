# 📋 Especificaciones Técnicas: Integración de Auth Externo y Recuperación de Clave

Este documento sirve como guía de implementación y especificaciones técnicas para el **equipo externo** encargado de integrar la autenticación multi-plataforma (Google, GitHub, Microsoft) y consolidar el flujo de recuperación de clave en **ABDAuth**.

---

## 🎯 Objetivo General
Habilitar el inicio de sesión federado (Social Login) asignando a los usuarios nuevos un **Tenant Temporal** por defecto, y documentar el flujo completo de **Recuperación de Clave (Password Recovery)** bajo la biblioteca **Better Auth** del ecosistema **ABD**.

---

## 📚 Documentos de Referencia a Considerar
El equipo externo debe leer y respetar los siguientes documentos del repositorio antes de iniciar el desarrollo:

1. **Guía de Estilos Visuales**: [STYLE_GUIDE.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/STYLE_GUIDE.md) — Define los estándares estéticos *Tech-Noir / Abisal* (paletas HSL, bordes rectos `rounded-none`, grain, etc.).
2. **Hoja de Ruta General**: [ROADMAP.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/ROADMAP.md) — Para entender el contexto de las fases y dependencias.
3. **Especificaciones de Desarrollo Unificado**: [PROMPT_UNIFICADO_DESARROLLO.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/PROMPT_UNIFICADO_DESARROLLO.md) — Reglas y restricciones de calidad estricta (no variables `any` en TypeScript, uso de `next-intl` para traducciones, etc.).
4. **Auditoría de Auth**: [auditoria.md de ABDAuth](file:///d:/desarrollos/ABDSuite/ABDAuth/auditoria.md) — Describe decisiones arquitectónicas previas y parches de seguridad críticos que no se deben romper.
5. **Auditoría del SDK Satélite**: [auditoria.md de ABDSatelliteSDK](file:///d:/desarrollos/ABDSuite/ABDSatelliteSDK/auditoria.md) — Para asegurar la compatibilidad con el sistema de sesiones y el enmascaramiento de PII.

---

## 🌐 1. Configuración de Proveedores Sociales en Better Auth
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
      tenantId: process.env.MICROSOFT_TENANT_ID || "common", 
    }
  },
  // ...
});
```

### Variables de Entorno Requeridas en `.env.local`
```env
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret

MICROSOFT_CLIENT_ID=tu_microsoft_client_id
MICROSOFT_CLIENT_SECRET=tu_microsoft_client_secret
MICROSOFT_TENANT_ID=common
```

---

## 🏢 2. Lógica de Asignación a Tenant Temporal
El modelo de identidad de la suite ABD requiere obligatoriamente los campos `tenantId`, `role`, `dbPrefix` e `isolationStrategy` en la entidad `User`.

Cuando un usuario se loguea por primera vez con un proveedor externo, Better Auth creará el registro del usuario. Se debe usar el hook `database.createUser` de Better Auth para interceptar la creación y poblar los campos obligatorios del **Tenant Temporal**:

```typescript
// Configuración propuesta en hooks de Better Auth (src/lib/auth.ts)
export const auth = betterAuth({
  // ...
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              role: user.role || "USER",
              // Asignación de tenant temporal por defecto
              tenantId: "temp-tenant",
              dbPrefix: "temp",
              isolationStrategy: "COLLECTION_PREFIX",
              active: true,
              mfaEnabled: false,
              mfaEnforced: false,
              mfa_verified: false,
            }
          };
        }
      }
    }
  }
});
```

---

## 🔐 3. Flujo de Recuperación de Clave (Password Recovery)
Better Auth implementa la recuperación mediante el envío de un token temporal por correo electrónico.

### Paso A: Solicitud de Enlace (Forgot Password)
1. El usuario introduce su correo en `/login/forgot-password`.
2. Se llama a la Server Action o endpoint que invoca a `auth.api.forgetPassword`:

```typescript
// Ejemplo de Server Action en src/services/auth/recovery-actions.ts
import { auth } from "@/lib/auth";

export async function requestPasswordResetAction(email: string) {
  try {
    await auth.api.forgetPassword({
      body: {
        email,
        // URL de la UI de reseteo a donde viajará el token
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login/reset-password`,
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error generating reset token:", error);
    return { success: false };
  }
}
```

3. **Envío del Correo**: Better Auth delega el envío en la propiedad `email` de la configuración. Se debe integrar con **Resend** (ya en las dependencias del proyecto):
```typescript
// En src/lib/auth.ts
emailAndPassword: {
  enabled: true,
  sendResetPassword: async ({ user, url }) => {
    // Implementar envío de email formal mediante Resend
    // template: Enlace de restablecimiento de contraseña para ABD Suite
  }
}
```

### Paso B: Restablecimiento de Clave (Reset Password)
1. El usuario hace clic en el enlace recibido en su email (`/login/reset-password?token=...`).
2. La UI en `/login/reset-password` lee el `token` de los query parameters y permite ingresar la nueva contraseña.
3. Al enviar el formulario, se invoca a `auth.api.resetPassword`:

```typescript
// En la UI o Server Action del reset
await auth.api.resetPassword({
  body: {
    newPassword: password,
    token: tokenFromUrl,
  }
});
```

---

## 🎨 4. Directrices de Interfaz (Chasis Tech-Noir / Uncodixfy)
El equipo externo debe integrar visualmente los botones de acceso social en el componente [LoginForm.tsx](file:///d:/desarrollos/ABDSuite/ABDAuth/src/app/%5Blocale%5D/login/components/LoginForm.tsx) respetando las siguientes pautas estéticas:

1. **Separador**: Un divisor horizontal sutil de estilo industrial.
2. **Botones Sociales**:
   - Layout: Fila horizontal o grid de 3 columnas (Google, GitHub, Microsoft).
   - Estilo: Bordes rectos (`rounded-none`), fondo oscuro translúcido (`bg-secondary/20`), bordes sutiles (`border border-border`), efectos hover premium (cambio de borde a color de acento y brillo tenue).
   - Iconos: Minimalistas, monocromáticos, usando `lucide-react` u SVG embebidos limpios.
3. **Flujo de Carga**: Mostrar un spinner de carga (`Loader2` animado) si el usuario hace clic en cualquiera de los botones para evitar doble submit.

---

## 🔍 5. Plan de Verificación de Calidad
Cualquier cambio realizado debe pasar las siguientes fases de auditoría del pipeline unificado de la suite (`./scripts/abd-audit.ps1`):
* **Cero variables huérfanas o casts `any`**.
* **Zero-FOUC** y herencia correcta de estilos Tailwind v4.
* **Internacionalización total** de las etiquetas de los nuevos botones en `/src/messages/es.json` y `en.json`.

---

## 🚀 6. Pistas e Instrucciones para Tareas de Autenticación Futuras

El equipo de desarrollo externo debe tener en cuenta el siguiente backlog de seguridad e implementar las pautas detalladas a continuación:

### Task 6.1: Inicio de Sesión Biométrico / Passwordless (MFA WebAuthn & Passkeys)
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

### Task 6.2: Consola de Gestión y Revocación de Sesiones Activas
* **Objetivo**: Evitar sesiones concurrentes no deseadas permitiendo la auditoría desde el perfil del usuario.
* **Pautas**:
  1. Utilizar las APIs nativas de Better Auth para listar sesiones activas en un cliente React:
     ```typescript
     const { data: sessions } = await authClient.listSessions();
     ```
  2. Renderizar una tabla o lista de terminales activas detallando: Sistema Operativo, Navegador (derivados de `userAgent`), Fecha de creación, e IP.
  3. Proveer un botón de "Revocar Sesión" para eliminar sesiones individuales llamando a `authClient.revokeSession({ id: sessionId })` y un botón de "Cerrar sesión en todos los demás dispositivos" llamando a `authClient.revokeOtherSessions()`.

### Task 6.3: Integración de Single Sign-On Corporativo (OIDC / SAML Enterprise Bridge)
* **Objetivo**: Permitir a grandes tenants conectar su propio Azure AD / Okta.
* **Pautas**:
  1. Integrar el plugin `saml` o `oidc` en Better Auth.
  2. Diseñar un flujo de redirección dinámica en base al dominio o email introducido por el usuario. Si el usuario ingresa `admin@cliente-corporativo.com`, el login debe identificar el dominio, buscar si tiene SSO habilitado en base de datos y redirigir directamente al endpoint SAML/OIDC configurado para ese tenant.

### Task 6.4: Robustecimiento de la Política de Bloqueo de Cuentas (Account Lockout)
* **Objetivo**: Mitigar ataques de fuerza bruta.
* **Pautas**:
  1. En el flujo de login por contraseña (`loginAction`), auditar y guardar en la colección de usuarios los campos `loginAttempts` y `lockoutUntil`.
  2. Si los intentos fallidos superan un umbral (ej. 5 intentos), establecer `lockoutUntil = Date.now() + 15 * 60 * 1000` (15 minutos).
  3. Durante la verificación, bloquear el login inmediatamente si `lockoutUntil` es una fecha futura, mostrando un aviso descriptivo de cuenta temporalmente bloqueada.

### Task 6.5: Telemetría SOC2 y Envío de Alertas en Caliente a ABDLogs
* **Objetivo**: Garantizar el cumplimiento e inmutabilidad de logs de auditoría ante eventos críticos.
* **Pautas**:
  1. Cada evento de autenticación crítico (Login fallido, Bloqueo de cuenta, Reset de contraseña exitoso/solicitado) debe instanciar el cliente HTTP de `ABDLogs` para registrar un evento.
  2. Asegurarse de enmascarar cualquier PII utilizando el logger estructurado del SDK (`@abd/satellite-sdk`).
  3. Enviar metadatos como `ip`, `userAgent`, y el tipo de evento exacto (`AUTH_LOGIN_FAILED`, `AUTH_LOCKOUT_TRIGGERED`, `AUTH_PASSWORD_RESET_SUCCESS`).

### Task 6.6: Pantalla Centralizada de Perfil de Usuario en ABDAuth (Portabilidad desde ABDAgRAG)
* **Objetivo**: Unificar el panel de gestión del perfil de usuario y configuración de seguridad dentro de `ABDAuth` para todos los satélites.
* **Ubicación de Ruta Recomendada**:
  * Servidor: `src/app/[locale]/dashboard/profile/page.tsx`
  * Cliente: `src/app/[locale]/dashboard/profile/ProfileClient.tsx`
* **Instrucciones para el Equipo Externo**:
  1. **Integración con la Navegación**: Esta ruta hereda de manera automática el `SidebarNavigation` del layout raíz. Se debe registrar el enlace `/dashboard/profile` en las traducciones del menú de navegación.
  2. **Estructura Visual**: Reutilizar el chasis visual y la maquetación atómica probada en la aplicación `ABDAgRAG` (ver archivo de referencia: [ProfileClient.tsx en ABDAgRAG](file:///d:/desarrollos/ABDAgRAG/src/app/(authenticated)/settings/profile/ProfileClient.tsx)):
     * Tarjeta 1: **Información Personal** (nombre, apellido, teléfono) conectada a `authClient.updateUser`.
     * Tarjeta 2: **Seguridad & Credenciales** (formulario de contraseña y configuración de MFA) mapeado con las APIs de Better Auth.
     * Tarjeta 3: **Dispositivos y Sesiones Activas** (Task 6.2).
  3. **White-Labeling**: Cargar el estilo y logotipo dinámicamente mediante el layout del dashboard en base al `tenantId` de la sesión activa del usuario para garantizar Zero-FOUC y adaptación automática de marca.
  4. **Internacionalización (i18n)**: Todos los literales y etiquetas del perfil deben estar contenidos en los namespaces `/src/messages/es.json` y `en.json` (clave `profile.page`).

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/RECOVERY_FLOW_COMPARISON.md]]
	* [[01_active_specs/ROADMAP.md]]
	* [[01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/DISENO_SSO_TENANTS.md]]
	* [[02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/ABDAuth.md]]
