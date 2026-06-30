# 🌐 Grafo de Interrelaciones: ABDLanding (Landing Page & Portal)

Este documento representa el mapa de interrelaciones y redirecciones del portal público y lanzador central de la suite, **ABDLanding**, diseñado para su exploración en **Obsidian** mediante enlaces `[[WikiLinks]]`.

---

## 🏗️ Puntos de Entrada y Portal de Suite

### 🛰️ Proxy y Middleware de Locale
* [[src/proxy.ts]] (si aplica)
	* Redirige al usuario según su locale y verifica el estado de sesión activa usando `[[@ajabadia/satellite-sdk]]`.

### 🛣️ Vistas Principales
* [[src/app/[locale]/page.tsx]]
	* La portada y portal principal de entrada a las aplicaciones del ecosistema.
	* Si el usuario está autenticado, recupera la sesión con `getIndustrialSession()` de `[[@ajabadia/satellite-sdk]]` y renderiza la cuadrícula de aplicaciones permitidas basándose en los permisos de su organización (Tenant).
	* Renderiza los componentes y enlaces de la suite:
		* [[ABDAnalytics.md|📈 ABD Analytics]] (`https://analytics.abdia.es`)
		* [[ABDAuth.md|🔐 ABD Auth]] (`https://auth.abdia.es`)
		* [[ABDLogs.md|📊 ABD Logs]] (`https://logs.abdia.es`)
		* [[ABDFiles.md|📂 ABD Files]] (`https://files.abdia.es`)
		* [[ABDQuiz.md|🎓 ABD Quiz]] (`https://quiz.abdia.es`)
		* [[ABDtenantGovernance.md|🛡️ ABD Gobernanza]] (`https://tenantgovernance.abdia.es`)
	* Inyecta la librería de diseño `[[@ajabadia/styles]]` (HeroHeader) y la cabecera unificada.
	* Renderiza el componente de pie de página `GlobalFooter` desde `[[ABDEcosystemWidgets.md|🎨 ABDEcosystemWidgets]]`.

---

## 📚 Documentación de Especificaciones y Diseño

* **Especificaciones Activas**:
	* [[01_active_specs/ROADMAP.md]] (Planificación de despliegues y subdominios).
* **Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]] (Distribución de puertos locales y subdominios GoDaddy + Vercel).
