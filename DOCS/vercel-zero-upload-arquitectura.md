# Arquitectura Vercel + Zero-Upload para Letter Station

## Objetivo

Desplegar la aplicación en Vercel para usarla desde varios equipos, móviles y tablets, pero garantizando que **los archivos aportados por el usuario y sus derivados no se suban nunca a Internet ni a servicios internos**. La web puede estar hospedada en Vercel; el requisito es que el procesamiento documental se ejecute completamente en el navegador del usuario o en `Web Workers` locales.[cite:5][cite:19][cite:32][cite:34]

## Principio de diseño

La arquitectura debe separar dos planos:

- **Plano de distribución**: Vercel sirve HTML, JS, CSS, workers y assets de la aplicación.[cite:34]
- **Plano de tratamiento documental**: el navegador del usuario lee, parsea, transforma, renderiza y exporta los archivos sin enviarlos a ningún endpoint ni servicio remoto.[cite:24][cite:32][cite:34]

Mientras el archivo no entre en un `Route Handler`, `API Route`, `Server Action`, `Function`, `Blob store` ni librería remota con tráfico saliente, el hecho de usar Vercel como hosting no implica subida del contenido documental.[cite:5][cite:19][cite:22][cite:27][cite:34]

## Arquitectura objetivo

```text
Usuario
  │
  ├─ abre app en Vercel
  │
  ├─ descarga bundle estático de la app
  │
  ├─ selecciona archivo local
  │
  ├─ navegador procesa archivo
  │    ├─ Client Components
  │    ├─ IndexedDB local (opcional)
  │    ├─ Web Worker local
  │    ├─ render HTML/PDF/DOCX local
  │    └─ exportación local (download / File System Access API)
  │
  └─ cero envío del archivo a servidor
```

## Reglas no negociables

### 1. El pipeline documental es client-only

Todo lo siguiente debe ejecutarse exclusivamente en el navegador:

- carga del archivo,
- parseo ETL,
- mapeo de campos,
- merge de plantillas,
- render HTML,
- generación PDF,
- generación DOCX,
- cálculo de hashes,
- exportación final.[cite:24][cite:32][cite:34]

### 2. Cero endpoints para archivos

No debe existir ninguna ruta o acción que reciba archivos o contenido documental:

- `app/api/*` para upload o processing, [cite:19]
- `pages/api/*` para upload o processing, [cite:19]
- `Server Actions` que acepten `FormData` o `File`, [cite:34]
- `Vercel Functions` o Edge Functions dedicadas al pipeline documental.[cite:5][cite:7][cite:8]

### 3. Dependencias del motor documental 100% locales

Todas las librerías críticas del pipeline deben estar vendorized o empaquetadas dentro del bundle. Esto incluye render PDF, ZIP, templating, DOCX y cualquier dependencia del worker. Si una librería se carga desde CDN en runtime, ya existe tráfico de red y el aislamiento deja de ser estricto.[cite:24][cite:32]

### 4. Persistencia solo local

Persistencia permitida:

- memoria de ejecución,
- `IndexedDB`, [cite:24]
- `File System Access API`, [cite:24]
- `Blob` + `URL.createObjectURL` para descarga local.[cite:24]

Persistencia prohibida:

- Vercel Blob, [cite:22]
- S3 o buckets equivalentes, [cite:27]
- bases de datos remotas,
- colas, caches o log stores externos.[cite:22][cite:27]

## Estructura recomendada en Next.js

### Cliente

- `use client` en toda la estación documental y en los componentes que tocan `window`, `document`, `Blob`, `File`, `html2canvas`, `jsPDF`, `showSaveFilePicker` o `showDirectoryPicker`.[cite:24][cite:32][cite:34]
- `new Worker(new URL(..., import.meta.url))` para workers locales del bundle.[cite:32]
- IndexedDB/Dexie solo para almacenamiento local del navegador.

### Servidor

Permitido:

- servir la app,
- autenticación si no toca archivos,
- configuración de usuario no sensible,
- catálogo estático de presets o plantillas públicas no sensibles.

Prohibido:

- recibir archivos del usuario,
- recibir HTML generado, PDF, DOCX o JSON intermedio,
- recibir trazas del contenido parseado,
- auditar remotamente el contenido documental.

## Política CSP recomendada

Usar una `Content-Security-Policy` estricta y, en especial, controlar `connect-src`, ya que esa directiva regula conexiones iniciadas por `fetch()`, `XMLHttpRequest`, `WebSocket`, `EventSource` y `sendBeacon()`.[cite:36][cite:38][cite:39]

### Objetivo CSP

- permitir cargar la app desde el propio origen,
- impedir conexiones salientes innecesarias,
- cortar analítica, reporting y SDKs de terceros,
- y garantizar que el modo documental no pueda hablar con otros dominios.[cite:36][cite:38][cite:39]

### Ejemplo orientativo

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self' data:;
  connect-src 'self';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
```

Si no necesitas ninguna conexión dinámica durante el uso documental, `connect-src 'self'` ya reduce mucho la superficie de exfiltración. Si además no tienes APIs propias necesarias en esa ruta funcional, el aislamiento puede ser aún más estricto según el diseño final.[cite:36][cite:38][cite:39]

## Medidas concretas para Letter Station

### Fase 1. Blindaje del runtime

- Vendorizar `docx-preview`, `html2canvas`, `jszip`, `handlebars`, `pizzip`, `docxtemplater` y cualquier otra librería del pipeline documental.[cite:24][cite:32]
- Eliminar `importScripts('https://...')` y cualquier `script.src` remoto en `RendererHost` o workers.
- Revisar que el worker cargue solo recursos locales del propio bundle o `/public/vendor/`.

### Fase 2. Auditoría de red

Buscar y prohibir en la zona documental:

- `fetch(`,
- `axios`,
- `XMLHttpRequest`,
- `navigator.sendBeacon`,
- `WebSocket`,
- `EventSource`,
- SDKs de analytics,
- SDKs de error reporting,
- upload forms o `FormData` enviados a servidor.[cite:36][cite:39]

### Fase 3. Contención funcional

- Mantener ETL, plantillas, preview, PDF y DOCX dentro de componentes cliente y workers locales.[cite:24][cite:32][cite:34]
- Si hay autenticación, aislarla del pipeline documental para que el archivo nunca viaje con el contexto de login.
- No registrar en backend nombres de archivo, tamaño, hash ni número de registros procesados.

### Fase 4. Verificación

Comprobar en DevTools:

- que no haya requests salientes al cargar y procesar un documento salvo los assets de la propia app,
- que el worker no dispare conexiones externas,
- que no existan beacons, analytics o errores remotos,
- y que la generación de PDF/DOCX no necesite red.[cite:36][cite:38][cite:39]

## Qué puedes afirmar si lo implementas bien

Si aplicas esta arquitectura correctamente, podrás afirmar algo como esto:

> La aplicación está desplegada en Vercel, pero los archivos del usuario se procesan íntegramente en su navegador. El contenido documental no se envía al servidor ni a servicios de terceros durante el parseo, render o exportación.[cite:32][cite:34][cite:36]

## Qué no debes afirmar si mantienes el estado actual

No debes afirmar que el sistema es “zero-upload” o “sin salida a red” mientras:

- existan librerías cargadas desde CDN en runtime,
- haya endpoints de subida aunque no se usen normalmente,
- haya analítica o reporting remoto activo,
- o el worker documental pueda iniciar conexiones salientes.[cite:22][cite:27][cite:36][cite:39]

## Checklist final

- [ ] No existe upload endpoint para documentos.[cite:19][cite:34]
- [ ] No existen Server Actions que reciban archivos.[cite:34]
- [ ] No existen Vercel Functions para procesar documentos.[cite:5][cite:7]
- [ ] Todo el pipeline documental corre en cliente o worker local.[cite:24][cite:32]
- [ ] Todas las dependencias documentales están vendorized/locales.[cite:24][cite:32]
- [ ] `connect-src` está restringido.[cite:36][cite:39]
- [ ] No hay analytics ni reporting remoto en la estación documental.[cite:36][cite:38]
- [ ] DevTools confirma cero requests salientes durante el procesamiento.
