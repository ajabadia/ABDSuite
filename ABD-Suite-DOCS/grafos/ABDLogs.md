# 📊 Grafo de Interrelaciones: ABDLogs (Audit & Security Monitoring)

Este documento representa el mapa de interrelaciones, flujos de procesamiento de logs forenses, detección de anomalías y alertas del componente **ABDLogs**, estructurado mediante enlaces bidireccionales (`[[WikiLinks]]`) para su exploración interactiva en **Obsidian**.

---

## 🏗️ Puntos de Entrada y API de Logs

### 🛰️ Proxy y Middleware de Locale
* [[src/proxy.ts]]
	* Intercepta peticiones del locale y verifica la autenticación básica del satélite usando `[[@ajabadia/satellite-sdk]]`.

### 🛣️ Endpoints API REST (Ingesta y Verificación)
* [[src/app/api/logs/route.ts]]
	* Endpoint principal para la ingesta masiva de logs de auditoría forenses (`POST`) y consultas de filtrado (`GET`).
	* Delega la lógica de almacenamiento a `[[src/services/tenant/audit-service.ts]]`.
	* Dispara de manera asíncrona la comprobación de límites a través de `[[src/services/tenant/alert-service.ts]]` y el motor de detección de anomalías `[[src/services/tenant/anomaly-engine.ts]]`.
* [[src/app/api/logs/verify/route.ts]]
	* Permite la verificación de la integridad criptográfica de la cadena de logs.
	* Consume el verificador `[[src/services/tenant/audit-chain-verifier.ts]]`.

---

## 🛠️ Capa de Servicios y Procesamiento de Eventos

* [[src/services/tenant/audit-service.ts]]
	* Gestiona la creación de registros de auditoría forense con encadenamiento SHA-256 (`hash` del log anterior + `hash` del log actual) para asegurar la inmutabilidad de la cadena (Audit Chain).
	* Interactúa directamente con el modelo `[[src/models/AuditLog.ts]]`.
* [[src/services/tenant/anomaly-engine.ts]]
	* Motor de análisis heurístico que detecta comportamientos sospechosos (por ejemplo, ráfagas de accesos fallidos de una misma IP, accesos simultáneos desde ubicaciones geográficas distantes).
	* Guarda registros en `[[src/models/AnomalyRecord.ts]]`.
* [[src/services/tenant/alert-service.ts]]
	* Evalúa si un evento de auditoría infringe los límites de seguridad configurados.
	* Consulta las configuraciones de alertas en `[[src/models/AlertThreshold.ts]]`.
	* Crea y persiste alertas en `[[src/models/AlertEvent.ts]]`.
* [[src/services/tenant/audit-chain-verifier.ts]]
	* Verifica la cadena criptográfica recalculando los hashes secuencialmente para garantizar que no ha habido manipulación o borrado físico de la base de datos de logs.
* [[src/services/tenant/gdpr-service.ts]]
	* Gestiona la anonimización y la depuración del ciclo de vida de datos sensibles para cumplir con la regulación GDPR/RGPD.
* [[src/services/tenant/threshold-cache.ts]]
	* Cache en memoria de los límites de alerta para evitar consultas recurrentes a base de datos.

---

## 📂 Modelos de Datos (Mongoose)

* [[src/models/AuditLog.ts]]
	* Representa cada log forense registrado en el ecosistema (IP, UserAgent, Actor, EventType, hash inmutable anterior y actual).
* [[src/models/AlertThreshold.ts]]
	* Configuración personalizada de límites de seguridad y alarmas por Tenant (ej. max_failed_logins = 5).
* [[src/models/AlertEvent.ts]]
	* Registro de infracciones de seguridad y alertas disparadas en el ecosistema.
* [[src/models/AnomalyRecord.ts]]
	* Registro histórico de anomalías y amenazas de seguridad detectadas por el motor heurístico.

---

## 🔐 Seguridad y Gobernanza

* [[src/lib/abac.ts]]
	* Valida permisos ABAC a nivel de endpoint contra el SDK `[[@ajabadia/satellite-sdk]]`.

---

## 📚 Documentación de Especificaciones y Diseño

* **Especificaciones Activas**:
	* [[01_active_specs/ROADMAP.md]] (Hitos de integración y auditoría unificada).
* **Historial y Archivo**:
	* [[03_archive/PLAN_ARQUITECTURA_ABDLOGS.md]] (Plan de arquitectura inicial para el servidor de logs).
	* [[03_archive/log-append.md]] (Especificación técnica del encadenamiento hash de logs).

