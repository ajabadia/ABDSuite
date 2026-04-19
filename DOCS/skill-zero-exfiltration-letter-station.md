# Skill: Zero-Exfiltration Document Processing

## Objetivo

Diseñar, revisar o refactorizar aplicaciones documentales para que **los archivos aportados por el usuario nunca salgan del navegador ni de la máquina local**, evitando cualquier fuga hacia red interna, Internet, servicios propios, servicios de terceros, telemetría, analítica o almacenamiento remoto. La skill se aplica especialmente a flujos como ETL, plantillas HTML/DOCX, generación PDF, indexación GAWEB y exportación local.[cite:24][cite:32][cite:34]

## Principio rector

Todo archivo con datos personales debe ser tratado como **dato local-only**. Eso implica que la aplicación puede estar alojada en Vercel o en cualquier otro hosting, pero el tratamiento del archivo solo es aceptable si ocurre en **Client Components, Web Workers del navegador, memoria local, IndexedDB local o File System Access API**, sin pasar por endpoints ni funciones del servidor.[cite:5][cite:24][cite:32][cite:34]

## Qué sí está permitido

- Leer archivos con `File`, `Blob`, `FileReader`, `ArrayBuffer` o streams del navegador.[cite:24][cite:32]
- Procesar datos en `Web Workers` del navegador para no bloquear la UI.[cite:32]
- Persistir temporalmente en memoria, `IndexedDB` o escribir en disco local con `showSaveFilePicker` / `showDirectoryPicker` cuando el navegador lo soporte.[cite:24]
- Renderizar HTML, DOCX y PDF íntegramente en cliente si el motor no necesita llamadas de red.[cite:24][cite:32][cite:34]

## Qué está prohibido

- Subir archivos a `Route Handlers`, `API Routes`, `Server Actions` o `Vercel Functions`.[cite:5][cite:19][cite:34]
- Enviar contenido o metadatos del archivo por `fetch`, `XMLHttpRequest`, `sendBeacon`, formularios o sockets.[cite:5][cite:19][cite:34]
- Guardar archivos o fragmentos en Vercel Blob, S3 u otros servicios remotos.[cite:22][cite:27]
- Cargar librerías críticas desde CDN en runtime si participan en el pipeline documental, porque eso introduce dependencia de red y superficie de fuga.[cite:24][cite:32]
- Activar telemetría, error reporting remoto o analítica sobre nombres de archivo, tamaño, número de registros o contenido derivado.[cite:5][cite:34]

## Regla arquitectónica

Si una función necesita `window`, `document`, `File`, `Blob`, `iframe`, `html2canvas`, `showSaveFilePicker`, `showDirectoryPicker` o acceso directo al DOM, esa función pertenece al **navegador** y no debe migrarse a servidor.[cite:24][cite:32][cite:34]

Si una parte del sistema corre en servidor, esa parte debe considerarse automáticamente **no apta** para procesar archivos sensibles, salvo que solo reciba instrucciones sin contenido ni metadatos personales. Vercel no convierte automáticamente lógica cliente en lógica servidor, pero sí ejecuta del lado servidor cualquier Route Handler, Function o Server Action que se implemente.[cite:5][cite:7][cite:19][cite:34]

## Checklist de implementación zero-exfiltration

### 1. Entrada de archivos

- El archivo solo puede entrar por `<input type="file">` o File System Access API.[cite:24]
- No se permite arrastrar y soltar hacia componentes que luego serialicen a servidor.
- El archivo debe mantenerse como `File`/`Blob`/`ArrayBuffer` local durante todo el pipeline.[cite:24][cite:32]

### 2. Procesamiento

- Parseo ETL, mapping, merge de plantillas y generación documental deben ejecutarse en Client Components o Web Workers.[cite:32][cite:34]
- El worker debe ser un `Web Worker` del navegador, no una función remota disfrazada.[cite:32]
- Los motores documentales (ZIP, Handlebars, docxtemplater, render PDF, etc.) deben estar vendorized/locales, no servidos por CDN.[cite:24][cite:32]

### 3. Persistencia

- Persistencia permitida: memoria, IndexedDB local y disco local explícitamente autorizado por el usuario.[cite:24]
- Persistencia prohibida: cualquier backend, bucket, blob store, cache remota o cola externa.[cite:22][cite:27]

### 4. Red

- No debe existir ninguna llamada saliente desde el pipeline documental.
- Debe auditarse el código para detectar `fetch`, `axios`, `XMLHttpRequest`, `navigator.sendBeacon`, `WebSocket`, `EventSource` y SDKs de terceros.
- La política CSP debe limitar al máximo `connect-src` para bloquear conexiones no autorizadas.[cite:32]

### 5. Observabilidad

- Los logs deben quedarse en memoria local o almacenamiento local no sincronizado.
- No se permite enviar errores ni stack traces a plataformas remotas mientras haya datos documentales en sesión.
- Los logs visibles para usuario nunca deben incluir contenido sensible del fichero.

### 6. Hosting

- El hosting puede servir el bundle de la aplicación, pero no debe participar en el tratamiento documental.[cite:5][cite:34]
- Vercel es válido solo como hosting estático/app shell si el procesamiento real sigue siendo browser-only.[cite:5][cite:19][cite:34]

## Política de red recomendada

Adoptar una política de seguridad tipo “deny by default”. Como mínimo, el modo documental sensible debe:

- bloquear conexiones salientes innecesarias,
- desactivar analítica,
- desactivar reporting remoto de errores,
- evitar SDKs de terceros,
- y operar con librerías locales vendorized.[cite:24][cite:32][cite:34]

## Regla operativa para revisiones de código

Cada vez que se revise una feature nueva, aplicar esta pregunta:

> ¿Este cambio hace que algún byte del archivo, de su contenido derivado o de sus metadatos pueda cruzar el límite del navegador?

Si la respuesta es sí, la feature no cumple zero-exfiltration y debe rediseñarse.

## Señales de incumplimiento

Una aplicación **no** cumple esta skill si ocurre cualquiera de estas condiciones:

- Se usa una API de subida de archivos o un endpoint de procesamiento.[cite:5][cite:19]
- El motor documental depende de CDNs o `importScripts` remotos durante ejecución.[cite:24][cite:32]
- Se guardan artefactos intermedios en cloud storage.[cite:22][cite:27]
- Se manda telemetría, analítica o errores con contexto documental.[cite:5][cite:34]
- Se usan Server Actions o Route Handlers para manipular los archivos.[cite:19][cite:34]

## Patrón recomendado para Letter Station

Para una estación documental tipo Letter Station, el patrón objetivo es:

- UI React en cliente,
- Worker documental en navegador,
- librerías vendorized/locales,
- IndexedDB local solo si es imprescindible,
- exportación final a carpeta local del usuario,
- y cero tráfico de red desde que el archivo entra hasta que el artefacto sale.[cite:24][cite:32][cite:34]

## Prompt reutilizable

Usa esta instrucción cuando quieras que un agente o desarrollador trabaje bajo esta política:

> Aplica un modo **zero-exfiltration**. Ningún archivo aportado por el usuario, ni su contenido, ni metadatos, ni derivados, puede salir del navegador o de la máquina local. Todo parseo, transformación, render y exportación debe ejecutarse client-side o en Web Workers locales. Prohíbe cualquier uso de Route Handlers, Server Actions, Vercel Functions, storage remoto, telemetría, analítica, CDNs en runtime y llamadas de red asociadas al pipeline documental. Si una solución requiere red, descártala y propone una alternativa browser-only.
