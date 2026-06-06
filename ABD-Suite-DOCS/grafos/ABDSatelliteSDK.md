# 📦 Grafo de Interrelaciones: ABDSatelliteSDK (Ecosystem Core SDK)

Este documento representa el mapa de interrelaciones del SDK central del ecosistema, **ABDSatelliteSDK**, que unifica la gestión de sesiones federadas, políticas de acceso ABAC, logging de auditoría forense e inyección de branding dinámico en todos los satélites. Está diseñado para su exploración en **Obsidian** mediante enlaces `[[WikiLinks]]`.

---

## 🏗️ Núcleo de Integración y Middleware

* [[src/index.ts]]
	* Entrypoint principal del SDK. Exporta utilidades de sesión, enrutamiento, branding y logger.
* [[src/proxy.ts]]
	* Middleware unificado para Next.js que intercepta peticiones en los satélites.
	* Valida tokens de sesión federada contra el IdP central `[[ABDAuth]]`.
	* Resuelve el idioma del locale y redirige a flujos de autenticación.
* [[src/routeHandler.ts]]
	* Orquestador para interceptar y envolver respuestas HTTP en Next.js.
	* Injecta cabeceras de seguridad y procesa validaciones de CORS y tokens.
* [[src/session.ts]]
	* Gestiona la desencriptación del JWT del usuario y la validez local de la sesión.
	* Llama al endpoint de validación de `[[ABDAuth]]` en peticiones críticas.

---

## 📊 Sistema de Auditoría y Logging Unificado

* [[src/logger/index.ts]]
	* Cliente de logs forenses unificado (`logger.audit`, `logger.error`, `logger.info`).
	* Limpia metadatos sensibles de forma automática consumiendo `[[src/logger/redact-pii.ts]]`.
	* Soporta resiliencia de red local mediante `[[src/logger/offline-buffer.ts]]`.
	* Envía los logs procesados al microservicio centralizado `[[ABDLogs]]`.
* [[src/logger/redact-pii.ts]]
	* Expresiones regulares y algoritmos para ofuscar información personal identificable (PII) como contraseñas, emails o tokens en los logs antes de ser transmitidos.
* [[src/logger/offline-buffer.ts]]
	* Buffer en memoria local que almacena temporalmente los logs cuando el microservicio de logs no está accesible.
	* Intenta retransmitir automáticamente al recuperar conectividad (resiliencia offline).

---

## 🎨 Branding y Client-Side Hooks

* [[src/client.ts]]
	* Entrypoint de cliente para React/Next.js. Exporta hooks y componentes visuales reactivos.
* [[src/client/useSession.tsx]]
	* Hook de React que expone el estado de sesión activa, roles y metadatos de inquilino al frontend de los satélites.
* [[src/styles/BrandingStyles.tsx]] (si aplica)
	* Utilidades para inyectar variables CSS personalizadas (HSL de marca, logotipos, radios de bordes) del Tenant en el DOM.

---

## 📚 Documentación de Especificaciones y Diseño

* **Especificaciones Activas**:
	* [[01_active_specs/ROADMAP.md]] (Planificación del ciclo de vida del SDK y satélites).
* **Historial y Archivo**:
	* [[03_archive/PLAN_SDK_SATELITE.md]] (Planificación de arquitectura y alcance del SDK).
	* [[03_archive/PLAN_DESARROLLO_SATELITES_SEGURIDAD.md]] (Especificaciones de integración segura en satélites).

