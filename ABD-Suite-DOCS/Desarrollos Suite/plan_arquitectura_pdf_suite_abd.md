# Plan de implementación para la nueva capacidad documental de ABDSuite

## Objetivo

Este documento resume las conclusiones finales sobre cómo incorporar la nueva capacidad de gestión documental y PDF dentro de ABDSuite, y convierte esas conclusiones en un plan claro de ejecución para un equipo de desarrollo junior. La suite ABD ya está organizada como un ecosistema de aplicaciones separadas por responsabilidad, conectadas por servicios comunes, autenticación federada, trazabilidad centralizada y control de permisos multi-tenant.[cite:242][cite:245][file:268][file:267]

La nueva capacidad no debe diseñarse como una utilidad aislada, sino como una extensión coherente del modelo de la suite: subdominios independientes, permisos centralizados, aislamiento estricto por tenant, uso de componentes compartidos, y trazabilidad homogénea con el resto del ecosistema.[file:268][file:269][file:267]

## Conclusión arquitectónica final

La recomendación final es crear **dos aplicaciones nuevas**, no una sola y no cuatro microproductos. La separación correcta es por dominio de negocio y no por función técnica individual.[web:254][file:268][file:267]

### Aplicación 1: `docs.abdia.es`

Esta aplicación será la responsable del procesamiento de documentos existentes. Debe incluir las funciones de extracción de texto, OCR opcional, limpieza del texto, operaciones PDF y preparación de contenido para ingestión posterior o reutilización documental.[page:2][file:267]

### Aplicación 2: `templates.abdia.es`

Esta aplicación será la responsable de la gestión de plantillas y generación documental. Debe incluir plantillas PDF, plantillas de email, gestión de branding reutilizable, assets comunes, versionado, publicación y permisos finos por tenant, departamento, grupo y usuario.[file:267][file:269]

## Decisión descartada

No se recomienda crear cuatro aplicaciones independientes separadas para extraer, manipular, generar y editar plantillas. Esa fragmentación elevaría la complejidad operativa, aumentaría el coste de mantenimiento y empeoraría la experiencia de navegación y permisos para los usuarios internos.[web:254]

Tampoco se recomienda una única aplicación “todo en uno” para PDF y plantillas. En la suite ABD, las capacidades ya están distribuidas por dominios claros como Auth, Logs, Gobernanza y Analytics, y esta nueva funcionalidad debe seguir esa misma línea de especialización.[file:268][cite:245]

## Razonamiento de negocio

El procesamiento de documentos y la gestión de plantillas son dominios diferentes. Una cosa es operar sobre un PDF real ya existente, y otra muy distinta es diseñar, gobernar, aprobar y publicar plantillas reutilizables para múltiples canales.[file:267]

Las plantillas PDF y las plantillas de email sí deben convivir en la misma aplicación de plantillas, porque comparten varios conceptos transversales: branding, versionado, permisos, assets, aprobación y publicación. La separación debe hacerse por tipo de renderer o esquema interno, no por aplicación independiente.[file:267][file:269]

## Encaje con la arquitectura actual

ABDSuite ya define una separación clara de responsabilidades: ABDAuth como proveedor de identidad, ABDtenantGobernance como consola de negocio y permisos, ABDSatelliteSDK como contrato de seguridad compartido, ABDStyles como chasis visual común, y ABDLogs como servicio central de auditoría y telemetría.[file:268][file:269][file:267]

Las nuevas apps deben entrar en ese ecosistema como satélites normales. No deben reimplementar autenticación, branding dinámico, control de tenant, ni lógica local de auditoría por su cuenta. Deben integrarse con el SDK, el sistema SSO y el esquema de permisos ya definidos para la suite.[file:269][file:267]

## Aplicación `docs.abdia.es`

### Responsabilidad principal

Procesar documentos existentes subidos por el usuario o capturados desde otros flujos del sistema.[page:2]

### Funciones incluidas

- Extraer texto de PDFs con capa de texto.
- Ejecutar OCR cuando el PDF sea imagen o escaneo.
- Limpiar texto para dejarlo utilizable por motores de búsqueda, RAG o revisión manual.
- Manipular páginas: unir, separar, reordenar, borrar, recortar o seleccionar rangos.
- Generar artefactos derivados: texto limpio, texto bruto, metadatos, miniaturas, hashes y logs.
- Preparar salida estructurada para otros sistemas de la suite.

### Límites de esta app

- No diseña plantillas reutilizables.
- No gestiona campañas de email.
- No es el panel maestro de branding.
- No define permisos por sí sola; solo consume permisos de la plataforma.[file:267][file:269]

## Aplicación `templates.abdia.es`

### Responsabilidad principal

Gobernar plantillas reutilizables y sus variantes por tenant, grupo, departamento y usuario.[file:267]

### Funciones incluidas

- Crear y editar plantillas PDF.
- Crear y editar plantillas email.
- Gestionar variables, placeholders y bloques reutilizables.
- Mantener brand kits por tenant.
- Versionar y publicar plantillas.
- Definir ámbitos de visibilidad y edición.
- Mantener assets compartidos aprobados (logos, cabeceras, imágenes institucionales).

### Submódulos internos recomendados

- `pdf-templates`
- `email-templates`
- `brand-kits`
- `assets`
- `publishing`
- `approvals`

### Límites de esta app

- No procesa OCR ni parsing pesado de PDFs.
- No manipula documentos existentes de forma operativa.
- No reemplaza a `docs.abdia.es`.[file:267]

## Modelo de permisos recomendado

El sistema de permisos no debe resolverse solo con roles globales simples. La documentación existente de ABDtenantGobernance ya define un modelo con grupos, políticas ABAC, espacios, roles delegados y evaluación jerárquica de permisos, por lo que las nuevas aplicaciones deben apoyarse en ese motor y no inventar otro sistema paralelo.[file:267]

### Principios obligatorios

- Todo recurso debe estar asociado a `tenantId`.
- Toda consulta debe filtrar por el `tenantId` resuelto desde la sesión validada.[file:269]
- La UI puede mostrar u ocultar acciones, pero la autorización real siempre debe resolverse en backend.[file:267]
- Los permisos deben poder aplicarse a nivel de tenant, departamento, grupo y usuario.[file:267]

### Recomendación para recursos de plantillas

Cada plantilla debe tener como mínimo estos campos conceptuales:

- `tenantId`
- `channel`: `pdf | email`
- `scopeType`: `tenant | department | group | user`
- `scopeId`
- `status`: `draft | review | published | archived`
- `createdBy`
- `updatedBy`
- `version`
- `visibilityRules`

### Roles funcionales sugeridos

- `viewer`
- `editor`
- `approver`
- `publisher`
- `admin`

Estos roles no deben codificarse como una lista global rígida en Auth. Deben mapearse a grupos y políticas del tenant, siguiendo el enfoque ya establecido en ABDtenantGobernance.[file:267]

## Integración con Auth, Gobernanza y Logs

### Auth

Las nuevas aplicaciones deben integrarse con ABDAuth mediante SSO federado y validación de JWT firmados. Los satélites deben usar el contrato ya definido en la suite para validar sesión, claims y tenant activo.[file:269]

### Gobernanza

La gestión de usuarios, grupos, departamentos, licencias y políticas debe mantenerse fuera de las apps satélite. `docs.abdia.es` y `templates.abdia.es` deben consultar o consumir permisos emitidos por el plano de gobernanza y por el SDK común.[file:267]

### Logs y trazabilidad

Todas las acciones relevantes deben emitirse también a ABDLogs como eventos auditables. La suite ya define el uso de un servicio central de auditoría y telemetría, por lo que no debe construirse un sistema aislado de logging dentro de estas nuevas aplicaciones.[file:268][cite:245]

### Eventos mínimos que deben auditarse

- Documento subido.
- OCR ejecutado.
- Texto extraído.
- Texto exportado.
- Páginas reordenadas o eliminadas.
- Plantilla creada.
- Plantilla editada.
- Plantilla publicada.
- Plantilla archivada.
- Uso de una plantilla para render real.
- Error de autorización.
- Acceso denegado por política.

## Stack técnico recomendado

### Para `docs.abdia.es`

- Next.js como aplicación satélite.
- MongoDB para metadatos, jobs, resultados y configuraciones.
- `pdf-lib` para operaciones estructurales de PDF como merge, split y reorder.[page:1]
- `Scribe.js` para extracción de texto y OCR cuando convenga mantener la integración en JavaScript y Next.js.[page:2]
- Pipeline de limpieza propio para normalización, unión de líneas, limpieza de guiones, colapsado de espacios y reconstrucción de párrafos.[page:1][page:2]

### Para `templates.abdia.es`

- Next.js como aplicación satélite.
- MongoDB para versiones, assets, esquemas y publicación.
- Editor interno por bloques o schema-driven.
- Renderers diferenciados por canal: uno para PDF y otro para email.
- Reutilización estricta de `abdstyles` y del SDK satélite para branding, sesión y seguridad.[file:268][file:269]

## Estructura de datos sugerida

### Colección `documents`

- `tenantId`
- `departmentId?`
- `groupIds[]`
- `ownerUserId`
- `filename`
- `mimeType`
- `pages`
- `sourceStorageRef`
- `rawText`
- `cleanText`
- `ocrUsed`
- `processingStatus`
- `hash`
- `createdAt`
- `updatedAt`

### Colección `document_jobs`

- `tenantId`
- `documentId`
- `jobType`: `extract | ocr | clean | split | merge | reorder`
- `status`
- `requestedBy`
- `startedAt`
- `finishedAt`
- `error`

### Colección `templates`

- `tenantId`
- `channel`
- `scopeType`
- `scopeId`
- `name`
- `slug`
- `schemaVersion`
- `status`
- `currentVersionId`
- `brandKitId`
- `createdBy`
- `updatedBy`
- `publishedAt`

### Colección `template_versions`

- `tenantId`
- `templateId`
- `version`
- `schema`
- `renderConfig`
- `changeSummary`
- `createdBy`
- `createdAt`

## Reglas obligatorias para el equipo junior

### 1. No crear lógica de permisos local simplificada

No se debe hacer un `if (role === 'admin')` como mecanismo suficiente de autorización. La suite ya tiene una dirección arquitectónica clara basada en JWT, grupos, políticas y validación centralizada.[file:267][file:269]

### 2. No acceder a datos sin contexto de tenant

Toda operación de base de datos debe resolverse con el contexto del tenant activo. La documentación de la suite insiste en el filtrado explícito por tenant y en el uso del enrutamiento multi-DB cuando aplique.[file:267][file:269][file:266]

### 3. No escribir CSS ad-hoc local

Toda interfaz nueva debe reutilizar `abdstyles`, el sistema visual común y las reglas del chasis existente. La documentación lo marca como obligatorio para mantener consistencia visual y evitar desviaciones de layout.[file:266][file:268]

### 4. No construir APIs redundantes entre satélites sin necesidad

Cuando el patrón existente ya usa servicios comunes, SDK o vistas materializadas, no deben inventarse canales paralelos. La suite ya ha documentado este problema como un error típico de equipos junior, especialmente en Analytics.[file:266]

### 5. No almacenar trazas críticas solo de forma local

Los eventos clave deben terminar también en ABDLogs. Guardar únicamente en la base operativa local rompe el principio de auditoría central e inmutable.[file:266][file:268]

## Fases de implementación recomendadas

## Fase 1: Fundaciones

- Crear repositorio `docs.abdia.es`.
- Crear repositorio `templates.abdia.es`.
- Integrar ambos con SSO, SDK satélite y branding dinámico.
- Configurar subdominios y despliegue en Vercel siguiendo el patrón de la suite.[file:268][file:269]
- Crear skeletons de layout, navegación, guards y contexto de tenant.

## Fase 2: `docs.abdia.es` MVP

- Subida de PDF.
- Extracción de texto básico.
- OCR opcional.
- Limpieza básica de texto.
- Persistencia de texto bruto y limpio.
- Auditoría de eventos.
- Filtro de acceso por tenant y permisos mínimos.

## Fase 3: `docs.abdia.es` operaciones

- Merge/split/reorder.
- Gestión de páginas.
- Exportes.
- Metadatos y hashes.
- Preparación de salidas para otros módulos.

## Fase 4: `templates.abdia.es` MVP

- CRUD de plantillas PDF.
- CRUD de plantillas email.
- Versionado.
- Estados `draft/review/published`.
- Restricción de acceso por grupo/departamento/usuario.
- Registro de auditoría.

## Fase 5: Gobierno de plantillas

- Aprobación/publicación.
- Brand kits.
- Assets reutilizables.
- Historial de cambios.
- Clonado controlado entre ámbitos del mismo tenant.

## Fase 6: Integración transversal

- Conectar renderizado de plantillas con otros módulos que necesiten generar documentos o emails automáticos.
- Alinear eventos con ABDLogs.
- Añadir cuadros de telemetría futura en Analytics si procede, siempre desde vistas materializadas o integraciones definidas por la suite.[file:266]

## Checklist técnico de aceptación

- SSO funcionando con ABDAuth.[file:269]
- Validación de tenant por subdominio y JWT.[file:269]
- Filtro de datos por tenant en todas las queries.[file:269]
- Uso de `abdstyles` y chasis visual común.[file:266][file:268]
- Auditoría mínima enviada a ABDLogs.[file:268]
- Sin variables `any` y con TypeScript estricto según la guía de desarrollo unificado.[file:269]
- Internacionalización preparada si la app tendrá UI final para cliente.[file:266][file:265]
- Sin permisos hardcodeados fuera del modelo de gobernanza.[file:267]

## Riesgos que el equipo debe evitar

- Mezclar en una sola app el procesamiento documental y la gobernanza de plantillas.
- Romper el modelo multi-tenant con consultas sin filtro.
- Duplicar lógica de auth o permisos dentro de cada app.
- Crear una app distinta por cada microfunción técnica.
- Diseñar el sistema de plantillas PDF separado totalmente del de emails, perdiendo reutilización de branding, assets, versionado y aprobación.
- Usar la UI como única barrera de seguridad.

## Tareas iniciales concretas para repartir al equipo junior

### Equipo A: Fundaciones satélite

- Crear base Next.js de `docs.abdia.es`.
- Integrar SDK satélite.
- Integrar layout compartido y branding.
- Validar sesión y tenant.
- Conectar logging básico.

### Equipo B: Pipeline documental

- Implementar subida segura.
- Integrar extracción de texto.
- Integrar OCR opcional.
- Implementar servicio de limpieza de texto.
- Persistir resultados y estados de job.

### Equipo C: Operaciones PDF

- Implementar split/merge/reorder.
- Diseñar el modelo de jobs y artefactos.
- Añadir hashes y metadatos.

### Equipo D: Plantillas

- Crear base Next.js de `templates.abdia.es`.
- Implementar entidades `templates` y `template_versions`.
- Hacer CRUD básico por canal `pdf | email`.
- Incorporar versionado y estado editorial.

### Equipo E: Gobernanza y seguridad

- Diseñar adaptadores de permisos desde ABDtenantGobernance.
- Asegurar filtros por tenant, grupo, departamento y usuario.
- Auditar accesos y denegaciones.

## Resultado esperado

Al finalizar estas fases, ABDSuite dispondrá de dos nuevas capacidades alineadas con su arquitectura actual: una aplicación documental operativa y una aplicación de plantillas/generación con gobierno fino. Esta división respeta la separación por dominios, reduce complejidad innecesaria y permite crecer más adelante sin rediseñar la base del sistema.[file:268][file:267][cite:242]
