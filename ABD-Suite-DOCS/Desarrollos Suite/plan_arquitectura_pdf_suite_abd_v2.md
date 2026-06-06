# Plan de implementación v2 para la capacidad documental y de plantillas en ABDSuite

## Objetivo

Este documento consolida las conclusiones finales sobre cómo incorporar la nueva capacidad documental dentro de ABDSuite y las traduce en un plan accionable para un equipo de desarrollo junior. La solución debe respetar la arquitectura actual de la suite: aplicaciones separadas por dominio, autenticación federada, trazabilidad centralizada, permisos multi-tenant y reutilización obligatoria del chasis técnico común.[cite:242][cite:245][file:268][file:269][file:267]

Además de la arquitectura general, este documento incorpora los requisitos transversales que deben aplicarse desde el primer día: accesibilidad, internacionalización, consistencia visual, tipado estricto, auditoría de calidad y cumplimiento del contrato técnico de los satélites ABD.[file:264][file:266][file:269]

## Conclusión arquitectónica final

La recomendación final sigue siendo crear **dos aplicaciones nuevas**, no una sola y no cuatro microproductos separados. La división correcta es por dominio de negocio y no por cada función técnica aislada.[web:254][file:268][file:267]

### Aplicación 1: `docs.abdia.es`

Esta aplicación será responsable del procesamiento de documentos existentes. Debe incluir extracción de texto, OCR opcional, limpieza textual, operaciones sobre páginas PDF y preparación de contenido para otros módulos.[page:2][file:267]

### Aplicación 2: `templates.abdia.es`

Esta aplicación será responsable de la gestión de plantillas y de la generación documental multicanal. Debe incluir plantillas PDF, plantillas email, brand kits, assets comunes, versionado, publicación, permisos finos y los dos sistemas de generación PDF ya decididos: uno simple y otro avanzado con soporte de PDFs accesibles.[cite:271][file:267][file:269]

## Decisión funcional clave: dos sistemas de generación PDF

Se confirma la necesidad de mantener **dos sistemas de generación PDF** dentro del dominio de plantillas y generación. Esta decisión responde a que no todos los tenants ni todos los casos de uso necesitan el mismo nivel de complejidad documental, y algunos tenants sí requieren generar **PDFs accesibles** como capacidad diferenciada.[cite:271]

### Sistema 1: Generación simple

Este sistema debe cubrir los casos de generación rápida, controlada y de menor complejidad estructural. Está pensado para documentos operativos, notificaciones, comunicaciones sencillas, plantillas de salida previsibles y flujos donde la prioridad es velocidad de implementación y mantenibilidad.[cite:271]

Características esperadas:

- Render rápido a partir de plantilla simple o schema compacto.
- Menor coste de mantenimiento.
- Menor expresividad estructural.
- No requiere por defecto soporte completo de accesibilidad avanzada en PDF.
- Adecuado para tenants o procesos que no tengan exigencias formales de PDF accesible.

### Sistema 2: Generación avanzada

Este sistema debe cubrir los casos en los que el documento tenga más exigencia funcional, normativa o de calidad formal. Aquí entra la generación de documentos complejos, con más control sobre estructura, semántica documental, componentes avanzados y, cuando el tenant lo requiera, **salida de PDF accesible**.[cite:271]

Características esperadas:

- Soporte de plantillas más ricas y expresivas.
- Posibilidad de control más fino del layout y de la estructura lógica.
- Preparado para documentos normativos, institucionales o de larga vida útil.
- Capacidad de producir PDFs accesibles cuando el caso de negocio y el tenant lo requieran.
- Mayor coste técnico y de QA, por lo que debe reservarse para escenarios que realmente lo justifiquen.

## Implicación arquitectónica de esta decisión

La consecuencia importante es que la generación PDF no debe modelarse como un único motor homogéneo. `templates.abdia.es` debe contener una capa de orquestación capaz de seleccionar el motor de render adecuado según el tipo de plantilla, el canal, el tenant, el nivel de complejidad y los requisitos de accesibilidad del documento.[cite:271][file:267]

Esto implica que la entidad de plantilla o la configuración de publicación debe declarar explícitamente qué sistema utiliza. No debe quedar como una decisión implícita escondida en el código.[cite:271]

## Modelo propuesto para los motores de generación

### Clasificación de motores

Se propone distinguir internamente entre:

- `simple-pdf-renderer`
- `advanced-pdf-renderer`
- `email-renderer`

### Campo obligatorio en plantillas PDF

Toda plantilla PDF debe declarar, como mínimo:

- `renderMode`: `simple | advanced`
- `accessibilityProfile`: `none | basic | accessible-pdf`

### Regla de negocio

- Si `renderMode = simple`, el documento se genera por el motor simple.
- Si `renderMode = advanced`, el documento se genera por el motor avanzado.
- Si `accessibilityProfile = accessible-pdf`, la plantilla debe quedar forzada al motor avanzado, porque el modo simple no debe prometer capacidades de accesibilidad documental avanzada que no pueda garantizar.[cite:271]

## Qué significa “PDF accesible” en esta suite

Dentro de ABDSuite, “PDF accesible” no debe tratarse como una etiqueta comercial, sino como un requisito funcional y de QA. La plataforma debe contemplar que algunos tenants necesitarán documentos consumibles por tecnologías de asistencia, con estructura más rigurosa y una salida documental que no se limite a “verse bien”. Esta necesidad ya obliga a separar el flujo simple del flujo avanzado.[cite:271]

A nivel de implementación para el equipo junior, esto significa una regla sencilla: **si una plantilla o proceso exige accesibilidad PDF, nunca debe salir por el renderer simple**. La accesibilidad no es un acabado visual adicional; es una capacidad del pipeline de generación.[cite:271]

## Importante: accesibilidad de la UI y accesibilidad del PDF son dos cosas distintas

El documento anterior no diferenciaba suficientemente estos dos planos. Aquí deben quedar separados desde el principio.[file:264][cite:271]

### A. Accesibilidad de la interfaz de usuario

Toda interfaz de `docs.abdia.es` y `templates.abdia.es` debe cumplir las reglas ya impuestas por la suite:

- `aria-label` en controles interactivos sin texto.[file:264]
- `alt` en imágenes, o `alt=""` si son decorativas.[file:264]
- Textos visibles internacionalizados mediante `next-intl`; nada de strings hardcodeadas en JSX.[file:264][file:265][file:266]
- Estados vacíos, de error y de carga con mensaje textual entendible y no solo señales visuales.[file:266]
- Uso del layout y chasis común para mantener predictibilidad de navegación y consistencia visual.[file:264][file:266][file:269]

### B. Accesibilidad del documento generado

La salida PDF también puede ser accesible en ciertos flujos. Esto no depende del frontend, sino del motor de generación, de la estructura de la plantilla, de la semántica incorporada y del pipeline de QA documental. Por eso debe existir el segundo sistema de generación avanzado.[cite:271]

## Encaje con la arquitectura actual

ABDSuite ya separa responsabilidades de forma nítida: ABDAuth como IdP, ABDtenantGobernance como plano de negocio y permisos, ABDLogs como auditoría central, ABDStyles como sistema visual y ABDSatelliteSDK como contrato de seguridad y branding para satélites.[file:268][file:269][file:267]

Las nuevas aplicaciones deben entrar en ese ecosistema como satélites normales. No deben reinventar autenticación, permisos, branding dinámico, layouts base ni sistemas locales de seguridad.[file:264][file:269]

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
- No es el estudio maestro de branding.
- No define permisos por sí sola; los consume desde la plataforma.[file:267][file:269]

## Aplicación `templates.abdia.es`

### Responsabilidad principal

Gobernar plantillas reutilizables y orquestar la generación de documentos y correos por tenant, grupo, departamento y usuario.[file:267][cite:271]

### Funciones incluidas

- Crear y editar plantillas PDF.
- Crear y editar plantillas email.
- Gestionar variables, placeholders y bloques reutilizables.
- Mantener brand kits por tenant.
- Versionar y publicar plantillas.
- Definir ámbitos de visibilidad y edición.
- Mantener assets compartidos aprobados.
- Ejecutar el motor simple o el motor avanzado según la plantilla.
- Marcar explícitamente si una salida requiere PDF accesible.[cite:271]

### Submódulos internos recomendados

- `pdf-templates`
- `email-templates`
- `brand-kits`
- `assets`
- `publishing`
- `approvals`
- `rendering-orchestrator`

## Modelo de permisos recomendado

El control de acceso no debe resolverse con roles simples hardcodeados. La documentación de ABDtenantGobernance ya define grupos, políticas ABAC, roles delegados, espacios y evaluación jerárquica, y las nuevas aplicaciones deben integrarse con ese modelo.[file:267]

### Principios obligatorios

- Todo recurso debe estar asociado a `tenantId`.[file:267][file:269]
- Toda consulta debe filtrar por el `tenantId` resuelto desde la sesión validada.[file:269]
- La UI puede sugerir acciones, pero la autorización real siempre debe resolverse en backend.[file:267]
- Los permisos deben poder aplicarse por tenant, departamento, grupo y usuario.[file:267][cite:241]

### Recomendación para recursos de plantillas

Cada plantilla debe tener, como mínimo:

- `tenantId`
- `channel`: `pdf | email`
- `scopeType`: `tenant | department | group | user`
- `scopeId`
- `status`: `draft | review | published | archived`
- `renderMode`: `simple | advanced`
- `accessibilityProfile`: `none | basic | accessible-pdf`
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

Estos roles no deben vivir como una lista rígida dentro de Auth. Deben mapearse a grupos y políticas del tenant siguiendo el modelo de Gobernanza.[file:267]

## Requisitos transversales obligatorios para el equipo junior

## 1. Accesibilidad UI obligatoria

Las nuevas aplicaciones deben respetar las reglas FIREA11YVIOLATION ya descritas en la suite. Esto implica como mínimo:

- `aria-label` en botones icon-only, botones de cerrar, retroceso, descarga y acciones rápidas.[file:264]
- `alt` en cualquier `img`.[file:264]
- Mensajes textuales en estados vacíos, error, carga y confirmación.[file:266]
- No ocultar información crítica solo mediante color o decoración visual; debe haber texto o estructura que la acompañe.[file:264][file:266]

## 2. Internacionalización obligatoria

Todo literal visible debe resolverse mediante `next-intl`. No se permiten cadenas hardcodeadas en JSX, títulos de botones, mensajes de error, breadcrumbs ni etiquetas técnicas visibles al usuario.[file:264][file:265][file:266]

## 3. Consistencia visual obligatoria

Todas las vistas deben usar el chasis de la suite:

- `ajabadiastyles`
- `ajabadiasatellite-sdk`
- `ajabadiaecosystem-widgets`
- `BrandingStyles`
- wrapper local de `SmartNavbar`
- `TenantSelector`
- `SystemSettings`
- `rounded-none`
- tokens HSL del sistema, nunca colores hardcodeados.[file:264][file:266][file:269]

## 4. Seguridad y tenancy obligatorios

- No duplicar lógica SSO.[file:264][file:269]
- No validar JWT manualmente fuera del SDK.[file:269]
- No consultar datos sin filtro de tenant.[file:269][file:266]
- No tratar permisos solo desde la UI.[file:267]
- No crear mini-modelos paralelos de autorización.[file:267]

## 5. Higiene de código obligatoria

- TypeScript estricto, sin `any`.[file:264][file:269]
- Componentes UI por debajo del umbral definido por la regla FIREMAXLINES cuando sea aplicable.[file:264]
- Separación correcta entre server components y client components del SDK.[file:264]
- Paso obligatorio por `abd-audit.ps1` antes de commit.[file:264][file:269]

## Integración con Auth, Gobernanza y Logs

### Auth

Las nuevas apps deben usar SSO federado con ABDAuth y validación de sesión a través del SDK satélite. El JWT debe ser la base de identidad del usuario dentro del contexto tenant.[file:269]

### Gobernanza

Los permisos, grupos, departamentos y políticas deben seguir residiendo en ABDtenantGobernance. `docs.abdia.es` y `templates.abdia.es` solo consumen ese plano de gobernanza.[file:267]

### Logs y trazabilidad

Todas las acciones relevantes deben enviarse también a ABDLogs. La suite ya define auditoría centralizada y no debe aparecer un sistema aislado de trazabilidad local.[file:268][cite:245]

### Eventos mínimos a auditar

- Documento subido.
- OCR ejecutado.
- Texto extraído.
- Texto exportado.
- Páginas reordenadas o eliminadas.
- Plantilla creada.
- Plantilla editada.
- Plantilla publicada.
- Plantilla archivada.
- Render PDF simple ejecutado.
- Render PDF avanzado ejecutado.
- Render PDF accesible ejecutado.
- Error de autorización.
- Acceso denegado por política.

## Stack técnico recomendado

### Para `docs.abdia.es`

- Next.js como satélite.
- MongoDB para metadatos, jobs, resultados y configuraciones.
- `pdf-lib` para operaciones estructurales de PDF como merge, split y reorder.[page:1]
- `Scribe.js` para extracción de texto y OCR cuando convenga mantener la integración en JavaScript y Next.js.[page:2]
- Pipeline de limpieza propio para normalización, unión de líneas, limpieza de guiones, colapsado de espacios y reconstrucción de párrafos.[page:1][page:2]

### Para `templates.abdia.es`

- Next.js como satélite.
- MongoDB para versiones, assets, esquemas y publicación.
- Editor schema-driven o por bloques.
- Orquestador de render con dos motores PDF y un renderer email.[cite:271]
- Reutilización obligatoria del SDK, branding y sistema visual compartido.[file:264][file:269]

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
- `renderMode`
- `accessibilityProfile`
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

## Reglas explícitas de prohibido / obligatorio

| Tema | Obligatorio | Prohibido |
|---|---|---|
| Arquitectura | Separar `docs` y `templates` por dominio.[file:268] | Crear una app distinta por cada microfunción. |
| PDF | Mantener motor simple y motor avanzado.[cite:271] | Unificar todos los casos en un único renderer indiferenciado. |
| PDF accesible | Usar siempre el motor avanzado.[cite:271] | Intentar resolver accesibilidad PDF dentro del motor simple. |
| UI | Usar chasis ABD, wrappers locales y tokens compartidos.[file:264][file:266] | CSS local improvisado y colores hardcodeados.[file:264] |
| i18n | Todo con `next-intl`.[file:264][file:266] | Strings hardcodeadas en JSX.[file:264] |
| Accesibilidad UI | `aria-label`, `alt`, estados comprensibles.[file:264][file:266] | Controles mudos o interfaces que dependan solo del color. |
| Seguridad | SDK satélite, JWT válido, filtro por tenant.[file:269] | Lógica local duplicada de auth o consultas sin tenant.[file:269] |
| Permisos | Consumir Gobernanza y Guardian.[file:267] | Resolver acceso con simples `if role === admin`. |
| Calidad | Ejecutar `abd-audit.ps1`.[file:264][file:269] | Commit sin certificación previa. |

## Fases de implementación recomendadas

## Fase 1: Fundaciones

- Crear repositorio `docs.abdia.es`.
- Crear repositorio `templates.abdia.es`.
- Integrar ambos con SSO, SDK satélite, branding dinámico, wrappers locales e i18n.[file:264][file:269]
- Configurar subdominios y despliegue en Vercel siguiendo el patrón de la suite.[file:268]
- Crear skeletons con layout, guards, contexto tenant y auditoría base.

## Fase 2: `docs.abdia.es` MVP

- Subida de PDF.
- Extracción de texto básico.
- OCR opcional.
- Limpieza básica de texto.
- Persistencia de texto bruto y limpio.
- Auditoría de eventos.
- Revisión de accesibilidad UI de las pantallas principales.

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
- Campo `renderMode` y `accessibilityProfile` desde el primer día.[cite:271]
- Restricción de acceso por grupo, departamento y usuario.
- Registro de auditoría.

## Fase 5: motores de generación

- Implementar `simple-pdf-renderer`.
- Implementar `advanced-pdf-renderer`.
- Implementar `email-renderer`.
- Construir `rendering-orchestrator`.
- Añadir políticas que impidan enviar una plantilla accesible al renderer simple.[cite:271]

## Fase 6: PDFs accesibles

- Definir catálogo de requisitos mínimos para “PDF accesible” dentro de la suite.
- Implementar flujo de QA específico para este tipo de salida.
- Limitar inicialmente esta capacidad a tenants, procesos o plantillas autorizadas.
- Registrar en auditoría qué documentos se han generado mediante el flujo accesible.[cite:271]

## Fase 7: gobierno de plantillas

- Aprobación/publicación.
- Brand kits.
- Assets reutilizables.
- Historial de cambios.
- Clonado controlado entre ámbitos del mismo tenant.

## Checklist técnico de aceptación

- SSO funcionando con ABDAuth.[file:269]
- Validación de tenant por subdominio y JWT.[file:269]
- Filtro de datos por tenant en todas las queries.[file:269]
- Uso de `ajabadiastyles`, SDK y chasis visual común.[file:264][file:266][file:269]
- Auditoría mínima enviada a ABDLogs.[file:268]
- Sin variables `any` y con TypeScript estricto.[file:264][file:269]
- Internacionalización preparada en toda UI final.[file:264][file:265][file:266]
- Sin permisos hardcodeados fuera del modelo de gobernanza.[file:267]
- `renderMode` y `accessibilityProfile` presentes en plantillas PDF.[cite:271]
- El flujo accesible usa exclusivamente el motor avanzado.[cite:271]

## Riesgos que el equipo debe evitar

- Mezclar en una sola app el procesamiento documental y la gobernanza de plantillas.
- Romper el modelo multi-tenant con consultas sin filtro.
- Duplicar lógica de auth o permisos dentro de cada app.
- Construir un único motor PDF y luego intentar añadir accesibilidad como parche tardío.[cite:271]
- Diseñar el sistema de plantillas PDF totalmente separado del de emails, perdiendo reutilización de branding, assets, versionado y aprobación.[cite:271]
- Usar la UI como única barrera de seguridad.

## Tareas iniciales concretas para repartir al equipo junior

### Equipo A: Fundaciones satélite

- Crear base Next.js de `docs.abdia.es`.
- Crear base Next.js de `templates.abdia.es`.
- Integrar SDK satélite, layout, wrappers, branding e i18n.[file:264][file:269]

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

### Equipo D: Plantillas y render

- Implementar entidades `templates` y `template_versions`.
- Hacer CRUD por canal `pdf | email`.
- Incorporar `renderMode` y `accessibilityProfile`.[cite:271]
- Implementar orquestación de motores.

### Equipo E: PDF avanzado y accesible

- Diseñar el contrato técnico del motor avanzado.
- Definir las precondiciones de plantilla para accesibilidad PDF.
- Preparar el flujo de QA documental diferenciado para salidas accesibles.[cite:271]

### Equipo F: Gobernanza y seguridad

- Diseñar adaptadores de permisos desde ABDtenantGobernance.
- Asegurar filtros por tenant, grupo, departamento y usuario.
- Auditar accesos, denegaciones y cambios de publicación.[file:267]

## Resultado esperado

Al finalizar estas fases, ABDSuite dispondrá de dos nuevas capacidades alineadas con su arquitectura actual: una aplicación documental operativa y una aplicación de plantillas/generación con gobierno fino, doble sistema de render PDF y soporte selectivo de PDF accesible para los tenants que lo necesiten. Esta división respeta la separación por dominios, evita complejidad innecesaria y deja preparada la base para evolucionar sin rediseñar el sistema más adelante.[cite:242][cite:271][file:267][file:268]

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ESPECIFICACIONES_ABDFILES.md]]
	* [[01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md]]
* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]
* **Grafos de Interrelaciones**:
	* [[grafos/ABDFiles.md]]
	* [[grafos/Mapa_Global_Suite.md]]
