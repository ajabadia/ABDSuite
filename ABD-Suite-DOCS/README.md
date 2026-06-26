# Ecosistema ABD: Repositorio de Documentación Central (ABD-Suite-DOCS)

Este directorio centraliza las especificaciones técnicas, guías de diseño de interfaz, modelos de arquitectura de datos y el histórico de planificación de la Suite ABD.

---

## 📂 Estructura Canónica de Directorios

Para mantener la claridad y evitar la obsolescencia de los documentos, el repositorio se organiza en tres áreas principales:

### 1. `01_active_specs/` (Especificaciones Activas)
Contiene las guías vivas, manuales de diseño y las instrucciones unificadas obligatorias que **deben seguir todos los desarrolladores y agentes de IA** en el trabajo diario sobre cualquier aplicación de la suite.
*   **[STYLE_GUIDE.md](./01_active_specs/STYLE_GUIDE.md)**: Manual del estilo industrial "Tech-Noir", leyes cromáticas HSL sin colores fijos, cabeceras, botones, tablas y alertas.
*   **[PROMPT_UNIFICADO_DESARROLLO.md](./01_active_specs/PROMPT_UNIFICADO_DESARROLLO.md)**: Prompt maestro de contexto de desarrollo, reglas de calidad (Fire Rules), validaciones automáticas y uso de `@ajabadia/satellite-sdk`.
*   **[ROADMAP.md](./01_active_specs/ROADMAP.md)**: Hoja de ruta activa, hitos alcanzados y próximas prioridades del ecosistema.

### 2. `02_architecture/` (Diseños y Arquitectura)
Documentación de base sobre el diseño técnico del ecosistema, los flujos criptográficos del Single Sign-On (SSO) y los análisis de integración multi-tenant.
*   **[ANALISIS_ARQUITECTURA.md](./02_architecture/ANALISIS_ARQUITECTURA.md)**: Estructura general de hubs y satélites.
*   **[DISENO_SSO_TENANTS.md](./02_architecture/DISENO_SSO_TENANTS.md)**: Flujos del protocolo de autorización y el ciclo de vida del JWT.

### 3. `03_archive/` (Archivo Histórico)
Planes de desarrollo, especificaciones de features específicas y auditorías que **ya han sido implementados, superados o finalizados**. Se preservan de forma inmutable únicamente para consultas retrospectivas o auditoría histórica.
*   *Planes de integración terminados*: `PLAN_ARQUITECTURA_ABDLOGS.md`, `PLAN_SDK_SATELITE.md`, `PLAN_GOBERNANZA_ACCESOS_TENANTS.md`, `MIGRATION_BETTER_AUTH.md`.
*   *Auditorías completadas*: `AUDITORIA_ESTILOS.md`, `style_adjustment_audit.md`, `SECURITY_AUDIT.md`, `STYLE_AUDIT_AND_CONSOLIDATION.md`.
*   *Fórmulas de prompts, logs y notas de diseño*: `PROMPT_1_LIBRERIA.md`, `PROMPT_2_APLICACIONES.md`, `log-append.md`, `navbar_brainstorming.md`.

---

## 🛠️ Regla de Mantenimiento
Cuando un plan de desarrollo (`03_archive/`) finaliza y sus componentes pasan a producción, cualquier regla general de código o diseño extraída del mismo debe consolidarse en la especificación activa correspondiente (`01_active_specs/`), archivando el plan original para mantener limpia la raíz del repositorio.
