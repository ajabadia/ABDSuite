# 🎨 Grafo de Interrelaciones: ABDEcosystemWidgets (Shared UI Widgets)

Este documento representa el mapa de interrelaciones del paquete de componentes visuales compartidos de la suite, **ABDEcosystemWidgets**, diseñado bajo el estándar visual Era 11. Está estructurado mediante enlaces bidireccionales (`[[WikiLinks]]`) para su exploración interactiva en **Obsidian**.

---

## 🏗️ Puntos de Entrada y Configuración

* [[src/index.ts]]
	* Exporta todos los widgets reutilizables del ecosistema para su consumo por parte de los satélites (ej. `[[ABDFiles]]`, `[[ABDtenantGobernance]]`).
* [[src/constants.ts]]
	* Define las constantes y rutas base compartidas por los componentes.
* [[src/types.ts]]
	* Tipados y modelos comunes de TypeScript para los widgets del ecosistema.

---

## 🔐 Componentes de Identidad y Acceso

* [[src/identity/TenantSelector.tsx]]
	* Selector multitenant premium que lee los Tenants autorizados por el usuario y permite cambiar el dominio/espacio de trabajo activo.
	* Realiza llamadas de API locales o federadas para refrescar el contexto.
* [[src/identity/LogoutSuccessView.tsx]]
	* Pantalla premium unificada de cierre de sesión, ahora integrada en todos los satélites (`[[ABDLanding]]`, `[[ABDFiles]]`, `[[ABDQuiz]]`, `[[ABDLogs]]`, `[[ABDAnalytics]]`, `[[ABDtenantGobernance]]`).
	* Detecta parámetros de error en la URL (`error=tenant_not_found`, etc.).
	* Invoca de manera dinámica al SDK `[[@ajabadia/satellite-sdk]]` para auditar accesos fallidos y registrar alertas en `[[ABDLogs]]`.
* [[src/identity/UserIdentity.tsx]]
	* Avatar e información del usuario logueado en la esquina del Navbar.

---

## 🗺️ Componentes de Navegación y Control Global

* [[src/navigation/SmartNavbar.tsx]]
	* Barra superior inteligente reactiva a la marca de la organización.
	* Integra menús contextuales:
		* Idiomas (`[[src/navigation/SmartNavbarLanguageMenu.tsx]]`)
		* Temas visuales (`[[src/navigation/SmartNavbarThemeMenu.tsx]]`)
		* Búsqueda global (`[[src/navigation/SmartNavbarSearchMenu.tsx]]`)
		* Menú de usuario (`[[src/navigation/SmartNavbarUserMenu.tsx]]`)
* [[src/navigation/CommandPalette.tsx]]
	* Atajo rápido `Ctrl+K` para lanzar comandos de administración y salto rápido entre espacios en toda la suite.
* [[src/navigation/GlobalFooter.tsx]]
	* Pie de página corporativo unificado de la suite.

---

## 📊 Visores de Auditoría y Logs

* [[src/audit/LiveLogViewer.tsx]]
	* Consola de visualización de eventos de auditoría forense en tiempo real.
* [[src/audit/AuditHistoryModal.tsx]]
	* Diálogo modal que renderiza el historial de modificaciones de un recurso específico.
* [[src/audit/AuditDeltaViewer.tsx]]
	* Visor interactivo de diferencias de datos (JSON Diff) entre versiones de recursos.

---

## 📚 Documentación de Especificaciones y Diseño

* **Especificaciones Activas**:
	* [[01_active_specs/STYLE_GUIDE.md]] (Guía de estilos visuales, HSL y temas Era 11).
* **Historial y Archivo**:
	* [[03_archive/navbar_brainstorming.md]] (Lluvia de ideas y estructuración del Navbar unificado).
	* [[03_archive/AUDITORIA_ESTILOS.md]] / [[03_archive/STYLE_AUDIT_AND_CONSOLIDATION.md]] (Auditoría de consistencia visual en la suite).
	* [[03_archive/style_adjustment_audit.md]] (Ajustes de personalización de temas por Tenant).
	* [[03_archive/PROMPT_1_LIBRERIA.md]] (Instrucciones de creación del paquete compartido de widgets).

