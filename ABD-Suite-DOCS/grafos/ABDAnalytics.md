# 📈 Grafo de Interrelaciones: ABDAnalytics (Metrics & Reporting)

Este documento representa el mapa de interrelaciones y flujos de análisis de datos y reportes ejecutivos del componente **ABDAnalytics**, diseñado para su exploración en **Obsidian** mediante enlaces `[[WikiLinks]]`.

---

## 🏗️ Puntos de Entrada y Vistas de Dashboard

### 🛰️ Proxy y Locale Middleware
* [[src/proxy.ts]]
	* Intercepta las solicitudes del locale e inyecta la verificación de sesión usando `[[@ajabadia/satellite-sdk]]`.

### 🛣️ Acciones de Servidor (Server Actions)
* [[src/actions/dashboard-actions.ts]]
	* Expone la lógica para extraer métricas agregadas por Tenant del almacenamiento de MongoDB.
	* Consume los modelos de base de datos para generar resúmenes:
		* `[[src/models/AuthAnalytics.ts]]`
		* `[[src/models/GovernanceAnalytics.ts]]`
		* `[[src/models/CourseAnalytics.ts]]`
		* `[[src/models/UserCourseSummary.ts]]`

---

## 📂 Modelos de Datos (Mongoose)

* [[src/models/AuthAnalytics.ts]]
	* Almacena métricas agregadas y KPI de rendimiento sobre procesos de inicio de sesión y autenticación en la plataforma.
* [[src/models/GovernanceAnalytics.ts]]
	* Contiene agregaciones de gobernanza, auditorías de accesos evaluados y uso de recursos/documentos.
* [[src/models/CourseAnalytics.ts]]
	* KPI agregados sobre progreso de alumnos, tasas de finalización y notas promedio en los cursos.
* [[src/models/UserCourseSummary.ts]]
	* Historial y resumen individual consolidado de los usuarios dentro del ecosistema de aprendizaje.

---

## 📚 Documentación de Especificaciones y Diseño

* **Especificaciones Activas**:
	* [[01_active_specs/ESPECIFICACIONES_ANALYTICS.md]] (Métricas del sistema, agregación y reportería executiva).
	* [[01_active_specs/ROADMAP.md]] (Planificación del módulo de dashboards analíticos).

