# Anexo técnico: pipeline de PDFs accesibles, i18n, versionado y auditoría en ABDSuite

## Propósito

Este anexo define cómo debe diseñarse el pipeline técnico de generación documental para cubrir documentos PDF normales, documentos PDF complejos y documentos PDF accesibles dentro de ABDSuite. El objetivo es dar al equipo una guía operativa clara para implementar validación, internacionalización, versionado, auditoría y estructura de proyecto sin romper la arquitectura multi-tenant ya definida en la suite.[cite:271][file:267][file:269]

## 1. Criterio general de arquitectura

La suite debe mantener dos motores de generación PDF:

- un motor **simple**, orientado a salidas rápidas y de complejidad controlada;[cite:271]
- un motor **avanzado**, orientado a documentos complejos y a todos los casos donde se exija PDF accesible.[cite:271]

Ninguna plantilla marcada como accesible debe pasar por el motor simple. La accesibilidad PDF debe tratarse como una capacidad del pipeline de render y validación, no como una mejora estética posterior.[cite:271]

## 2. Validación de PDFs según WCAG y PDF/UA

### 2.1 Qué validar

La validación de un PDF accesible debe cubrir dos planos complementarios:

- **WCAG aplicado a PDF**, que cubre criterios funcionales de accesibilidad del contenido, navegación y percepción del documento.[web:275][page:1]
- **PDF/UA**, que cubre la construcción técnica interna del PDF para que sea utilizable por tecnologías de asistencia, mediante Tagged PDF, estructura lógica, idioma, role mapping, semántica y otras restricciones formales.[web:277][page:2]

### 2.2 Requisitos mínimos de validación

Un PDF accesible debe revisarse, como mínimo, en estos puntos:

- Tagged PDF presente y consistente.[page:2]
- Orden lógico de lectura correcto.[page:1][page:2]
- Encabezados, listas y tablas etiquetados semánticamente.[page:1][page:2]
- Figuras con texto alternativo cuando proceda.[page:1][page:2]
- Elementos decorativos marcados como artifacts cuando no aporten contenido.[page:1]
- Idioma principal del documento definido y, cuando aplique, cambios de idioma en fragmentos específicos.[page:2]
- Fuentes embebidas.[page:2]
- Formularios etiquetados si existen campos interactivos.[page:2]
- Bookmarks en documentos largos o estructurados.[page:1]
- Orden de tabulación coherente cuando el documento sea interactivo.[page:1]

### 2.3 Estrategia recomendada de validación

La validación debe organizarse en tres niveles:

1. **Validación automática estructural**: comprobar reglas formales de PDF/UA y parte de WCAG.[page:2][web:279]
2. **Validación automática de contenido detectable**: títulos vacíos, imágenes sin alt, tablas no etiquetadas, ausencia de idioma, fuentes no embebidas.[page:1][page:2]
3. **Validación manual asistida**: revisar con lector de pantalla, navegación por teclado y comprobación semántica humana del contenido, porque hay aspectos que no se pueden certificar solo por máquina.[web:279][page:1]

### 2.4 Regla de aceptación

Un documento no debe considerarse “PDF accesible” solo porque el motor avanzado lo haya generado. Debe quedar asociado a un resultado de validación y, según el tipo documental, a una revisión manual trazable.[web:278][page:2][file:267]

## 3. Diferencias técnicas entre PDF/A y PDF/UA

PDF/A y PDF/UA resuelven problemas distintos:

- **PDF/UA** es el estándar orientado a accesibilidad y compatibilidad con tecnologías de asistencia.[web:277][page:2]
- **PDF/A** es el estándar orientado a preservación y archivo a largo plazo.[page:3]

### 3.1 Tabla comparativa

| Aspecto | PDF/UA | PDF/A |
|---|---|---|
| Finalidad | Accesibilidad documental.[web:277][page:2] | Preservación a largo plazo.[page:3] |
| Semántica estructural | Obligatoria, mediante Tagged PDF y estructura lógica.[page:2] | No garantiza accesibilidad por sí mismo.[page:3] |
| Lectores de pantalla | Objetivo principal.[page:2] | No es su objetivo principal.[page:3] |
| Conservación de recursos | No es su foco principal.[page:3] | Sí, es un requisito clave del estándar.[page:3] |
| Uso recomendado en la suite | Documentos accesibles.[page:2] | Documentos archivables o de conservación.[page:3] |

### 3.2 Regla de producto para ABDSuite

- Si el tenant solo necesita accesibilidad, el objetivo mínimo es **PDF/UA**.[page:2]
- Si el tenant necesita accesibilidad y archivo durable, el objetivo debe evaluarse como **PDF/UA + PDF/A** cuando el flujo y el motor lo soporten.[page:3]
- PDF/A no debe usarse como sustituto de accesibilidad, porque un PDF/A puede seguir siendo inaccesible.[page:3]

## 4. Estrategia de i18n para plantillas PDF multitenant

La internacionalización no debe resolverse clonando plantillas completas para cada idioma salvo que cambie radicalmente la maquetación. La estrategia recomendada es desacoplar layout, mensajes, formato regional y branding.[web:283][file:264][file:266]

### 4.1 Capas recomendadas

- **Plantilla base**: define estructura, bloques y slots semánticos.
- **Catálogo de mensajes**: contiene textos por locale y, si hace falta, por tenant.[file:264][file:266]
- **Brand kit**: colores, logotipo, tipografías y variantes visuales del tenant.[file:269]
- **Formateadores**: fechas, horas, moneda, numeración, pluralización y convenciones regionales.[web:283]

### 4.2 Jerarquía de resolución recomendada

1. `tenantId + locale`
2. `tenantId + defaultLocale`
3. `global + locale`
4. `global + defaultLocale`

### 4.3 Requisitos adicionales para PDFs accesibles

- El idioma principal del documento debe declararse en el PDF.[page:2]
- Los fragmentos en idioma distinto deben poder marcarse cuando el motor avanzado lo soporte.[page:2]
- Los textos alternativos y metadatos también deben estar localizados, no solo el cuerpo visual del documento.[page:1][page:2]

## 5. Gestión de versionado de plantillas en un sistema multitenant

El versionado debe ser inmutable, auditable y desacoplado de la entidad principal de plantilla. No se debe editar una versión publicada en caliente.[cite:271][file:267]

### 5.1 Entidades recomendadas

#### `templates`

Representa la identidad estable de la plantilla:

- `tenantId`
- `channel`
- `name`
- `slug`
- `scopeType`
- `scopeId`
- `status`
- `renderMode`
- `accessibilityProfile`
- `currentVersionId`
- `brandKitId`

#### `template_versions`

Representa un snapshot inmutable:

- `tenantId`
- `templateId`
- `version`
- `schema`
- `renderConfig`
- `messagesVersionRef`
- `brandKitVersionRef`
- `generatorCompatibility`
- `createdBy`
- `createdAt`
- `changeSummary`

#### `template_publications`

Permite activar una versión para un contexto concreto:

- `tenantId`
- `templateId`
- `templateVersionId`
- `environment`
- `publishedBy`
- `publishedAt`

### 5.2 Reglas obligatorias

- Toda versión publicada es inmutable.
- Toda modificación crea una nueva versión.
- Toda publicación debe dejar traza de quién la hizo y cuándo.[file:267]
- Toda plantilla PDF debe declarar `renderMode` y `accessibilityProfile`.[cite:271]
- Las plantillas accesibles deben ser compatibles con el motor avanzado.[cite:271]

## 6. Requisitos técnicos para auditoría de documentos PDF accesibles

La auditoría debe cubrir tanto el documento final como el proceso de generación. No basta con almacenar el PDF generado.[file:267][file:269]

### 6.1 Datos mínimos a registrar

- `tenantId`
- `documentId`
- `templateId`
- `templateVersionId`
- `renderMode`
- `accessibilityProfile`
- `generatorVersion`
- `locale`
- `requestedBy`
- `approvedBy` si aplica
- `sourceDataHash`
- `outputPdfHash`
- `validationSummary`
- `validationReportRef`
- `manualReviewStatus`
- `manualReviewBy`
- `manualReviewAt`
- `createdAt`

### 6.2 Eventos recomendados

- `PDF_RENDER_REQUESTED`
- `PDF_RENDER_COMPLETED`
- `PDF_RENDER_FAILED`
- `PDF_ACCESSIBILITY_VALIDATION_PASSED`
- `PDF_ACCESSIBILITY_VALIDATION_FAILED`
- `PDF_MANUAL_REVIEW_APPROVED`
- `PDF_MANUAL_REVIEW_REJECTED`
- `PDF_PUBLICATION_APPROVED`
- `PDF_PUBLICATION_ROLLED_BACK`

### 6.3 Política de estados sugerida

- `generated`
- `auto_validated`
- `manual_review_pending`
- `certified_accessible`
- `rejected`

## 7. Herramientas recomendadas para el pipeline

La recomendación aquí distingue entre herramientas de generación, manipulación, validación y soporte operativo.

### 7.1 Para procesamiento y operaciones PDF

- **pdf-lib**: recomendable para merge, split, reorder, borrado de páginas y transformaciones estructurales ligeras desde entorno JavaScript/TypeScript.[page:1]
- **Scribe.js**: recomendable para extracción de texto y OCR cuando se quiera una integración directa con Next.js y JavaScript.[page:2]

### 7.2 Para generación documental simple

- Motor interno schema-driven propio de la suite para `simple-pdf-renderer`, orientado a salidas previsibles y plantillas acotadas.[cite:271]

### 7.3 Para generación documental avanzada

Para `advanced-pdf-renderer`, la recomendación es un motor con más capacidad estructural y control semántico. A nivel de arquitectura, lo importante es que permita:

- control fino del árbol documental;
- marcaje estructural suficiente para PDFs accesibles;
- separación clara entre contenido, layout y metadatos;
- posibilidad de enganchar validación posterior.

En la suite conviene encapsular este motor detrás de una interfaz propia y no acoplar toda la plataforma a una librería concreta desde el dominio de negocio.[cite:271]

### 7.4 Para validación de accesibilidad PDF

- **Adobe Acrobat Pro Accessibility Checker**: útil como referencia práctica y revisión asistida de accesibilidad PDF en flujos manuales o QA especializado.[web:187]
- **PAC / validadores de PDF/UA equivalentes**: recomendables para validación automática de conformidad PDF/UA cuando el pipeline lo permita.[page:2][web:279]
- **Herramientas de contraste y revisión manual con lector de pantalla**: necesarias para cubrir aspectos WCAG no verificables automáticamente.[web:275][web:279]

### 7.5 Para archivado y conformidad de preservación

- Validadores compatibles con **PDF/A** cuando el tenant o el caso documental exijan conservación a largo plazo.[page:3]

### 7.6 Para trazabilidad y auditoría

- **ABDLogs** como backend de trazabilidad central, no un sistema aislado local.[file:267][file:269]
- Hashing de entrada y salida del documento para detectar cambios y demostrar integridad.[file:266][file:267]

## 8. Estructura de archivos recomendada

A continuación se propone una estructura inicial orientada a `templates.abdia.es`, que es donde vivirían los motores de render, el versionado, la validación y la auditoría de PDFs.

```text
src/
  app/
    [locale]/
      dashboard/
        templates/
          page.tsx
          [templateId]/
            page.tsx
            versions/
              page.tsx
            publish/
              page.tsx
        documents/
          page.tsx
          validations/
            page.tsx
    api/
      templates/
        route.ts
      templates/[templateId]/route.ts
      templates/[templateId]/versions/route.ts
      render/pdf/route.ts
      render/email/route.ts
      validation/pdf-accessibility/route.ts
      audit/pdf-events/route.ts

  components/
    templates/
      TemplateList.tsx
      TemplateEditor.tsx
      TemplateVersionHistory.tsx
      TemplatePublishDialog.tsx
    documents/
      DocumentValidationPanel.tsx
      AccessibilityReportCard.tsx
    layout/
      SidebarNavigation.tsx
      LogsCommandPalette.tsx
    ui/
      TenantSelector.tsx
      SystemSettings.tsx

  features/
    templates/
      domain/
        entities/
          Template.ts
          TemplateVersion.ts
          TemplatePublication.ts
        value-objects/
          RenderMode.ts
          AccessibilityProfile.ts
          TemplateScope.ts
      application/
        services/
          create-template.service.ts
          update-template.service.ts
          publish-template.service.ts
          clone-template.service.ts
      infrastructure/
        repositories/
          mongo-template.repository.ts
          mongo-template-version.repository.ts
          mongo-template-publication.repository.ts

    rendering/
      application/
        services/
          render-pdf.service.ts
          render-email.service.ts
          select-renderer.service.ts
      domain/
        interfaces/
          PdfRenderer.ts
      infrastructure/
        renderers/
          simple/
            simple-pdf-renderer.ts
            simple-layout-engine.ts
          advanced/
            advanced-pdf-renderer.ts
            advanced-tagging-engine.ts
            advanced-metadata-engine.ts

    validation/
      application/
        services/
          validate-pdf-accessibility.service.ts
          certify-pdf.service.ts
      domain/
        entities/
          ValidationReport.ts
      infrastructure/
        checkers/
          pdfua-checker.adapter.ts
          wcag-pdf-checker.adapter.ts
          manual-review.adapter.ts

    i18n/
      application/
        services/
          resolve-template-messages.service.ts
          resolve-locale-fallbacks.service.ts
      infrastructure/
        repositories/
          mongo-message-bundle.repository.ts

    audit/
      application/
        services/
          register-pdf-event.service.ts
      infrastructure/
        adapters/
          abdlogs.adapter.ts

  lib/
    auth/
    database/
    tenant/
    hashing/
    formatting/

  models/
    Template.ts
    TemplateVersion.ts
    TemplatePublication.ts
    DocumentValidation.ts
    PdfRenderJob.ts
```

## 9. Estructura de archivos recomendada para `docs.abdia.es`

```text
src/
  app/
    [locale]/
      dashboard/
        docs/
          page.tsx
          [documentId]/
            page.tsx
            text/
              page.tsx
            pages/
              page.tsx
            jobs/
              page.tsx
    api/
      documents/route.ts
      documents/[documentId]/route.ts
      documents/[documentId]/extract/route.ts
      documents/[documentId]/ocr/route.ts
      documents/[documentId]/clean/route.ts
      documents/[documentId]/pages/reorder/route.ts
      documents/[documentId]/pages/split/route.ts
      documents/[documentId]/pages/merge/route.ts

  features/
    documents/
      application/
        services/
          upload-document.service.ts
          extract-text.service.ts
          run-ocr.service.ts
          clean-text.service.ts
          reorder-pages.service.ts
          split-document.service.ts
          merge-documents.service.ts
      infrastructure/
        extractors/
          scribe-text-extractor.adapter.ts
        pdf/
          pdf-lib-page-ops.adapter.ts
      domain/
        entities/
          Document.ts
          DocumentJob.ts
```

## 10. Interfaces internas recomendadas

### 10.1 Interfaz de renderer PDF

```ts
export interface PdfRenderer {
  render(input: PdfRenderInput): Promise<PdfRenderResult>
}

export interface PdfRenderInput {
  tenantId: string
  templateId: string
  templateVersionId: string
  locale: string
  data: Record<string, unknown>
  renderMode: 'simple' | 'advanced'
  accessibilityProfile: 'none' | 'basic' | 'accessible-pdf'
}

export interface PdfRenderResult {
  storageRef: string
  outputPdfHash: string
  pageCount: number
  metadata: Record<string, unknown>
}
```

### 10.2 Interfaz de validación

```ts
export interface PdfAccessibilityValidator {
  validate(input: PdfValidationInput): Promise<PdfValidationResult>
}

export interface PdfValidationInput {
  tenantId: string
  documentId: string
  storageRef: string
  standardTargets: Array<'WCAG-PDF' | 'PDF-UA' | 'PDF-A'>
}

export interface PdfValidationResult {
  passed: boolean
  score?: number
  issues: Array<{
    code: string
    severity: 'info' | 'warning' | 'error'
    message: string
  }>
  reportRef?: string
}
```

## 11. Flujo recomendado de extremo a extremo

1. El usuario selecciona una plantilla PDF.
2. El sistema resuelve tenant, locale, brand kit, versión publicada y motor adecuado.[cite:271][file:269]
3. Si la plantilla exige accesibilidad, el orquestador fuerza el motor avanzado.[cite:271]
4. Se genera el PDF.
5. Se calcula el hash del documento de salida.[file:266][file:267]
6. Se lanza validación automática WCAG/PDF-UA y, si aplica, PDF/A.[web:275][page:2][page:3]
7. Se persiste el informe de validación.
8. Se registra el evento en ABDLogs.[file:267][file:269]
9. Si el tipo documental lo exige, pasa a revisión manual.
10. Solo entonces puede marcarse como documento accesible certificado.[web:279][file:267]

## 12. Checklist de implementación para el equipo

- El motor simple existe y está separado del avanzado.[cite:271]
- Las plantillas PDF tienen `renderMode` y `accessibilityProfile`.[cite:271]
- La i18n no está incrustada en el layout de la plantilla.[file:264][file:266]
- Existe validación automática PDF/UA y revisión manual cuando proceda.[page:2][web:279]
- La auditoría incluye hashes, versión de plantilla, locale y usuario solicitante.[file:267]
- Los logs viajan a ABDLogs y no quedan solo en Mongo local.[file:267][file:269]
- No se editan en caliente versiones publicadas.[cite:271]
- Los documentos accesibles no pasan nunca por el renderer simple.[cite:271]

## 13. Conclusión operativa

La combinación correcta para ABDSuite es: motor simple para salidas estándar, motor avanzado para documentos complejos y accesibles, validación híbrida WCAG/PDF/UA, opción de compatibilidad con PDF/A cuando haya necesidades de archivado, i18n desacoplada del layout, versionado inmutable por tenant y auditoría centralizada de extremo a extremo.[cite:271][page:2][page:3][file:267][file:269]

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ESPECIFICACIONES_ABDFILES.md]]
	* [[01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md]]
* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]
* **Grafos de Interrelaciones**:
	* [[grafos/ABDFiles.md]]
	* [[grafos/Mapa_Global_Suite.md]]
