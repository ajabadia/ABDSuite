# 🗺️ Mapa Global de Interrelaciones de ABDSuite

Este es el índice y punto de entrada central para la exploración interactiva de la arquitectura del ecosistema **ABDSuite** en **Obsidian**. Desde este archivo se conectan todos los grafos de componentes, especificaciones activas y el archivo de diseño histórico.

---

## 🛰️ Componentes y Satélites del Ecosistema

Selecciona cualquiera de los componentes para ver el detalle de sus interrelaciones de archivos internos y dependencias de la suite:

* **Control Plane & Seguridad**:
	* [[ABDtenantGovernance.md|🛡️ ABDtenantGovernance (Control Plane centralizado)]]
	* [[ABDAuth.md|🔐 ABDAuth (Proveedor de Identidad, SSO y SAML)]]
	* [[ABDLogs.md|📊 ABDLogs (Microservicio de Logs Forenses y Alertas)]]
* **Satélites de Aplicación**:
	* [[ABDLanding.md|🌐 ABDLanding (Landing Page y Portal de Entrada)]]
	* [[ABDFiles.md|📂 ABDFiles (Gestor de Almacenamiento y Carga de Documentos)]]
	* [[ABDQuiz.md|🎓 ABDQuiz (Ecosistema de Aprendizaje y Cuestionarios Normativos)]]
	* [[ABDAnalytics.md|📈 ABDAnalytics (Dashboards de Métricas y Analítica)]]
* **Librerías Compartidas**:
	* [[ABDSatelliteSDK.md|📦 ABDSatelliteSDK (SDK de Conectividad, Sesiones y Logs)]]
	* [[ABDEcosystemWidgets.md|🎨 ABDEcosystemWidgets (Librería de Componentes y UI unificada)]]

---

## 📚 Documentación de Referencia y Planificación

### 01. Especificaciones Activas (`01_active_specs`)
Los requerimientos funcionales y el roadmap de desarrollo de cada sección:
* [[01_active_specs/ROADMAP.md|📍 Roadmap Global de Desarrollo]]
* [[01_active_specs/STYLE_GUIDE.md|🎨 Guía de Estilos Visuales e Identidad Visual (Era 11)]]
* [[01_active_specs/ESPECIFICACIONES_ABDFILES.md|📄 Specs: Almacenamiento (ABDFiles)]]
* [[01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md|📄 Specs: Ciclo de vida del Documento]]
* [[01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md|📄 Specs: Autenticación y SSO (v2)]]
* [[01_active_specs/ESPECIFICACIONES_ECOSISTEMA_APRENDIZAJE.md|📄 Specs: Ecosistema de Aprendizaje (ABDQuiz)]]
* [[01_active_specs/ESPECIFICACIONES_ANALYTICS.md|📄 Specs: Analíticas y Métricas (ABDAnalytics)]]

### 02. Arquitectura de Sistemas (`02_architecture`)
El diseño del software y flujo de información de la suite:
* [[02_architecture/ANALISIS_ARQUITECTURA.md|🏗️ Análisis General de Arquitectura]]
* [[02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md|🏗️ Arquitectura de IAM y Motor Guardian (ABAC)]]
* [[02_architecture/DISENO_SSO_TENANTS.md|🏗️ Diseño del Flujo SSO Multitenant]]
* [[02_architecture/Configurar una Nueva Aplicación Satélite.md|🏗️ Configuración de Nuevas Aplicaciones Satélites]]

### 04. Desarrollos Suite (`Desarrollos Suite`)
Planificación de PDF e impresiones del gestor documental:
* [[Desarrollos Suite/ABDDocs & ABDTemplates.md|📄 Plantillas y Gestión de Documentos (ABDTemplates)]]
* [[Desarrollos Suite/plan_arquitectura_pdf_suite_abd_v2.md|📄 Plan de Arquitectura PDF (v2)]]
* [[Desarrollos Suite/anexo_tecnico_pdf_accesible_pipeline.md|📄 Pipeline de Accesibilidad de PDFs]]

### 03. Archivo Histórico (`03_archive`)
Planes iniciales de diseño y auditorías previas:
* [[03_archive/PLAN_SDK_SATELITE.md|📂 Plan de Desarrollo del SDK]]
* [[03_archive/PLAN_ARQUITECTURA_ABDLOGS.md|📂 Plan del Servidor de Logs (ABDLogs)]]
* [[03_archive/MIGRATION_BETTER_AUTH.md|📂 Plan de Migración a Better-Auth]]
* [[03_archive/PLAN_GOBERNANZA_ACCESOS_TENANTS.md|📂 Plan de Control Plane de Gobernanza]]
* [[03_archive/navbar_brainstorming.md|📂 Brainstorming del Navbar unificado]]

---

## 🛠️ Scripts de Ciclo de Vida y Desarrollo Local

Scripts globales de automatización del ecosistema:
* [superbuild.ps1](file:///d:/desarrollos/ABDSuite/superbuild.ps1) (Compilación, limpieza de caché de Webpack/TS, publicación y auto-commit de todo el ecosistema).
* [start-all.bat](file:///d:/desarrollos/ABDSuite/start-all.bat) (Limpieza de puertos locales y arranque paralelo en desarrollo local de todos los satélites).

