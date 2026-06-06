# 🔐 Grafo de Interrelaciones: ABDAuth (Identity & Access Provider)

Este documento representa el mapa de interrelaciones, flujos de autenticación federada, SSO y bases de datos del proveedor de identidad (IdP) del ecosistema, **ABDAuth**, estructurado mediante enlaces bidireccionales (`[[WikiLinks]]`) para su exploración interactiva en **Obsidian**.

---

## 🏗️ Puntos de Entrada y Rutas de Autenticación

### 🛰️ Proxy y Middleware de Locale
* [[src/proxy.ts]]
	* Protege las rutas principales de autenticación y gestiona la redirección multitenant.
	* Consume el SDK federado `[[@ajabadia/satellite-sdk]]`.

### 🛣️ Endpoints API de Autenticación (Better-Auth / SSO / SAML)
* [[src/app/api/auth/[...all]/route.ts]]
	* Manejador global de Better-Auth (Passkeys, password, etc.).
	* Consume la configuración centralizada de auth: `[[src/lib/auth.ts]]`.
* [[src/app/api/auth/sso/route.ts]]
	* Orquesta el inicio de sesión único (Single Sign-On).
	* Consume `[[src/services/auth/SsoService.ts]]`.
* [[src/app/api/auth/federated/route.ts]]
	* Maneja la autenticación federada S2S con otros satélites.
	* Consume `[[src/services/auth/FederationService.ts]]`.
* [[src/app/api/auth/logout/route.ts]]
	* Procesa la desconexión centralizada e invalida las sesiones activas.
* [[src/app/api/auth/validate/route.ts]]
	* Endpoint utilizado por los satélites para validar tokens de sesión en tiempo real.

---

## 🛠️ Capa de Servicios de Identidad y Seguridad

* [[src/services/auth/SsoService.ts]]
	* Genera y valida tokens SAML / OIDC / JWT para satélites federados.
	* Utiliza `[[src/lib/repositories/IdentityProviderRepository.ts]]` y `[[src/lib/repositories/ApplicationRepository.ts]]`.
* [[src/services/auth/FederationService.ts]]
	* Maneja la delegación de confianza entre inquilinos (Tenants).
	* Interactúa con `[[src/lib/repositories/FederatedCodeRepository.ts]]`.
* [[src/services/auth/SessionService.ts]]
	* Controla el ciclo de vida de las sesiones del navegador y tokens de refresco.
	* Consume `[[src/lib/repositories/SessionRepository.ts]]`.
* [[src/services/auth/SAMLService.ts]]
	* Firma y verifica aserciones SAML 2.0 usando claves criptográficas de la organización.
* [[src/services/security/SecurityService.ts]]
	* Evalúa riesgos de login, bloqueos temporales por fuerza bruta y políticas de MFA.
	* Consume `[[src/lib/repositories/RateLimitRepository.ts]]`.

---

## 📂 Repositorios y Modelos de Datos (Mongoose)

### Repositorios DAO
* [[src/lib/repositories/UserRepository.ts]] — Abstracción para operaciones de cuentas de usuario.
* [[src/lib/repositories/SessionRepository.ts]] — Gestión de almacenamiento y caducidad de sesiones activas.
* [[src/lib/repositories/TenantRepository.ts]] — Acceso a configuraciones del Tenant y branding.
* [[src/lib/repositories/ApplicationRepository.ts]] — Aplicaciones cliente registradas para SSO.
* [[src/lib/repositories/IdentityProviderRepository.ts]] — Proveedores de identidad externos configurados (SAML/ADFS/Google/etc.).
* [[src/lib/repositories/AuditAuthOpsRepository.ts]] — Registro local de logs forenses de autenticación y seguridad.

### Esquemas de MongoDB (Mongoose)
* [[src/lib/schemas/user.ts]] — Esquema de perfiles de usuario, roles, passkeys y estados de activación.
* [[src/lib/schemas/session.ts]] — Sesiones activas del sistema y tokens asociados.
* [[src/lib/schemas/tenant.ts]] — Metadatos de inquilinos, dominios permitidos e identidad visual.
* [[src/lib/schemas/application.ts]] — Clientes OAuth/SAML permitidos para SSO.
* [[src/lib/schemas/identity-provider.ts]] — Metadatos de proveedores federados externos.
* [[src/lib/schemas/audit.ts]] — Tabla forense de auditoría de intentos de login y fallos.

---

## 🎨 Componentes Visuales y Vistas

* [[src/app/[locale]/login/page.tsx]]
	* Vista premium de inicio de sesión con soporte para email, MFA, passkeys y login federado por Tenant.
	* Inyecta componentes interactivos como `[[LoginForm]]` y `[[PasskeySelector]]`.
* [[src/app/[locale]/activate/page.tsx]]
	* Flujo de activación de nuevas cuentas de usuario y configuración inicial de credenciales de seguridad.

---

## 📚 Documentación de Especificaciones y Diseño

* **Especificaciones Activas**:
	* [[01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO.md]] (Especificaciones de autenticación externa).
	* [[01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md]] (Refactorización del motor de SSO y autenticación federada).
	* [[01_active_specs/RECOVERY_FLOW_COMPARISON.md]] (Análisis comparativo de los flujos de recuperación de cuentas).
* **Arquitectura**:
	* [[02_architecture/DISENO_SSO_TENANTS.md]] (Diseño detallado de SSO multitenant).
* **Historial y Archivo**:
	* [[03_archive/MIGRATION_BETTER_AUTH.md]] (Plan de migración hacia better-auth).
	* [[03_archive/PLAN_DESARROLLO_SSO_ERRORS.md]] (Planificación del control de accesos e inicio de sesión seguro).

