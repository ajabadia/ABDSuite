# 🗺️ Hoja de Ruta de Analíticas - ABDAnalytics (ABDBoard)

Este documento detalla la planificación estratégica, las fases del ecosistema y los próximos hitos a desarrollar en la consola centralizada de analíticas unificadas.

---

## 🏁 Estado de Hitos del Roadmap

### 🟩 Completado (Completed)
- **Fase 1: Configuración del Cascarón y SSO**
  - Clonación base de logs y re-configuración del puerto `3700`.
  - Registro de federación de clientes y políticas de licenciamiento para todos los tenants en `ABDAuth`.
  - Adaptación de `@ajabadia/styles` y layout superior `SmartNavbar`.

### 🟩 Completado (Completed)
- **Fase 2: Conexión de Modelos y Datos de Solo Lectura**
  - ✅ Creación de esquemas Mongoose: `UserCourseSummary`, `CourseAnalytics`, `AuthAnalytics`, `GovernanceAnalytics`.
  - ✅ Conexión dinámica multi-tenant mediante `getTenantModel` con soporte `COLLECTION_PREFIX` y `DATABASE_PER_TENANT`.
  - ✅ 21/21 tests de modelos pasando.

- **Fase 3: Visualización del Dashboard del Administrador**
  - ✅ Vista de 4 pestañas: Resumen de la Suite, LMS (ABDQuiz), Seguridad (ABDAuth) y Gobernanza (ABDtenantGovernance).
  - ✅ Integración de gráficos `recharts` (histogramas Gauss, curvas de aprendizaje, accesos fallidos, consumo espacial).
  - ✅ DashboardClient con tabs modulares (`SuiteTab`, `LmsTab`, `SecurityTab`, `GovernanceTab`).
  - ✅ Certificación ERA 11 COMPLIANT.

### 🟦 Próximamente (Future Roadmap)
- **Fase 4: Firma Criptográfica de PDFs y QR**
  - Generación asíncrona de reportes PDF.
  - Integración del validador público enlazando hashes contra los logs inmutables de `ABDLogs`.
