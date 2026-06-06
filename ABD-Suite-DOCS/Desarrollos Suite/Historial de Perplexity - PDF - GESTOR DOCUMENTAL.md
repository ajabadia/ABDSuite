Si quieres **integrarlo rápido en Next.js y cubrir tanto PDF con texto como PDF escaneado con OCR**, el candidato más práctico que he visto para tu caso es **Scribe.js**. Extrae texto de PDFs nativos y, si el PDF es imagen, también hace OCR; además tiene ejemplo específico para Next.js, lo que reduce bastante la fricción de integración.[](https://github.com/topics/pdf-ocr-extraction?o=desc&s=stars)

## Recomendación

Para un stack Next.js + MongoDB, yo lo ordenaría así:

- **Opción 1: Scribe.js** si quieres una librería/repositorio JavaScript que puedas meter casi directa en tu app. Soporta extracción de texto de PDFs subidos por el usuario y OCR cuando el PDF no trae capa de texto, y tiene repo de ejemplo para Next.js.[](https://github.com/topics/pdf-ocr-extraction?o=desc&s=stars)
    
- **Opción 2: Unstructured** si priorizas limpieza/segmentación más avanzada del documento y te da igual montar un microservicio Python aparte. Está muy orientado a “document parsing” serio, soporta PDFs y OCR, pero pide más dependencias de sistema como Poppler y Tesseract, así que la integración es más pesada para un proyecto puramente Node.[](https://github.com/topics/text-extraction)
    

## Qué usaría yo

Si tu objetivo es: “subo PDF, saco texto lo más limpio posible, con OCR si hace falta, y lo guardo en Mongo”, usaría este enfoque:

1. Intentar **extracción directa** del PDF.
    
2. Si el resultado sale vacío o pobre, lanzar **OCR**.
    
3. Pasar una fase de **postproceso** propia: normalizar saltos de línea, quitar headers/footers repetidos, unir palabras cortadas por guion, colapsar espacios y reconstruir párrafos. Ese tercer paso suele ser el que más mejora la calidad final, más que cambiar de motor.
    

## Repositorios a mirar

|Repo|Cuándo elegirlo|Puntos fuertes|Pegas|
|---|---|---|---|
|[scribeocr/scribe.js](https://github.com/scribeocr/scribe.js)|Si quieres integración JS/Next directa|Extrae texto de PDF nativo y hace OCR en PDFs escaneados; instalación por npm; ejemplo para Next.js. [](https://github.com/topics/pdf-ocr-extraction?o=desc&s=stars)|Licencia AGPL-3.0, importante si tu proyecto no es compatible con esa licencia. [](https://github.com/topics/pdf-ocr-extraction?o=desc&s=stars)|
|[Unstructured-IO/unstructured](https://github.com/Unstructured-IO/unstructured)|Si quieres parsing más “document intelligence”|Muy usado para preprocesado de documentos complejos; soporta PDFs, OCR y particionado estructurado. [](https://github.com/topics/text-extraction)|Es Python y requiere dependencias del sistema como `tesseract-ocr` y `poppler-utils`, así que encaja mejor como servicio separado. [](https://github.com/topics/text-extraction)|
|[scribe.js-example-next.js](https://github.com/scribeocr/scribe.js-example-next.js)|Si eliges Scribe.js|Te da una base directa para integrar en Next.js. [](https://github.com/topics/pdf-ocr-extraction?o=desc&s=stars)|Dependes del ecosistema/licencia del proyecto principal. [](https://github.com/topics/pdf-ocr-extraction?o=desc&s=stars)|

## Mi criterio práctico

Para una app moderna con Next.js, empezaría con **Scribe.js** si quieres mantenerte en JavaScript casi todo el tiempo.[](https://github.com/topics/pdf-ocr-extraction?o=desc&s=stars)  
Si luego ves que necesitas extracción más semántica, mejor clasificación por bloques, tablas o documentos más caóticos, montaría **Unstructured** como servicio aparte y dejaría Next.js solo como frontend/API gateway.[](https://github.com/topics/text-extraction)

## Arquitectura sugerida

Una arquitectura limpia sería:

- Next.js sube el PDF a almacenamiento temporal.
    
- Un worker/API de extracción devuelve `rawText`, `ocrUsed`, `pages`, `confidence` y `cleanText`.
    
- MongoDB guarda tanto el texto bruto como el limpio para poder reparsear después sin reprocesar el PDF original.
    

En Mongo te conviene algo como: `sourcePdf`, `extractor`, `ocrUsed`, `rawText`, `cleanText`, `pageMap`, `status`, `createdAt`. Esto te permitirá comparar motores y mejorar tu pipeline sin perder trazabilidad.

Yo, para empezar hoy, elegiría **Scribe.js**. Si quieres, te preparo directamente un **mini stack para Next.js** con endpoint de subida, extracción, limpieza de texto y guardado en MongoDB.

---------------------
va a estar desplegado en vercel, no sé si me permite ejecutar Python, el destino es pasar textos lo más planos posibles y con la menor basura posible a un RAg para que haga chunks
------------------------------
Para **Vercel + Next.js + RAG**, yo **no** montaría la limpieza de PDFs en Python dentro del mismo despliegue salvo que tengas un motivo muy claro. Vercel sí soporta runtime Python en Functions y permite desplegar apps o funciones Python, pero para tu caso el cuello de botella real no es “si puede ejecutar Python”, sino que OCR y parsing de PDFs suelen ser pesados, dependen de binarios o bundles grandes, y eso complica bastante un despliegue serverless limpio.

## Qué elegiría

Tu objetivo es sacar texto **plano, limpio y estable** para chunking, así que en Vercel encaja mejor una ruta **100% JavaScript** con Scribe.js como extractor principal. Scribe.js extrae texto si el PDF ya tiene capa de texto y hace OCR si el PDF es imagen, además está pensado para navegador o Node.js y tiene ejemplo específico con Next.js.[](https://github.com/topics/text-extraction)

Para un RAG, esto importa porque lo que más degrada la calidad no suele ser “falta de OCR”, sino meter al índice texto con saltos raros, cabeceras repetidas, cortes por guiones, pies de página y bloques duplicados. Por eso la mejor arquitectura no es “el OCR más potente posible”, sino “extracción razonable + limpieza fuerte + chunking disciplinado”.

## En Vercel

Vercel soporta Python en Functions y también proyectos mixtos con frontend más servicio Python, pero el propio modelo de despliegue te obliga a cuidar dependencias, tamaño del bundle y estructura de entrypoints. Además, Vercel advierte que en Python no hay tree-shaking automático y que hay que vigilar el bundle para no pasarse de los límites.

Eso hace que, aunque **se pueda**, no sea la opción más cómoda para un pipeline de OCR/document parsing dentro del mismo repo si quieres algo mantenible en producción. Para tu caso, donde ya estás en Next/Vercel y el objetivo es preprocesado para RAG, la vía más simple es: extracción en JS y postproceso propio antes de persistir en Mongo.[](https://vercel.com/docs/functions/runtimes/python)

## Pipeline recomendado

Yo montaría este flujo:

1. Subes el PDF.
    
2. Intentas extraer texto directo.
    
3. Si sale muy poco texto, activas OCR.
    
4. Limpias agresivamente el resultado.
    
5. Guardas en Mongo `rawText`, `cleanText`, metadatos y señales de calidad.
    
6. El RAG solo chunkea `cleanText`.
    

Las limpiezas que más valor te van a dar son estas:

- Unificar saltos de línea dentro de párrafo y conservar solo separaciones reales.
    
- Quitar headers/footers repetidos por página.
    
- Eliminar números de página aislados.
    
- Reunir palabras cortadas por guion al final de línea.
    
- Colapsar espacios múltiples y líneas vacías excesivas.
    
- Detectar páginas casi vacías o ruido OCR.
    

Ese enfoque encaja muy bien con tu preferencia de centralizar la lógica y dejar el backend lo más controlado posible dentro del proyecto.[](https://www.perplexity.ai/search/069cb3a1-159f-45a1-8698-3ca9b63ee798)

## Mi recomendación concreta

La recomendación práctica sería esta:

- **Primera versión en Vercel:** `scribe.js-ocr` + pipeline de limpieza en TypeScript.[](https://github.com/topics/text-extraction)
    
- **No Python en Vercel al principio:** añade complejidad antes de demostrar que el problema real sea la extracción.
    
- **Si luego el OCR se queda corto:** mueve solo la parte pesada a un microservicio externo o worker especializado, y deja Next.js/Vercel como orquestador. Esa separación es más sana que forzar OCR serio dentro de Functions.
    

## Decisión final

Si el destino es **texto muy plano para RAG**, yo haría esto: **Scribe.js + limpieza propia + chunking posterior**, todo en TypeScript dentro de tu app Next.js. Scribe.js ya cubre el caso de PDF nativo y el de PDF escaneado, y te evita depender de un stack Python para la primera versión.[](https://github.com/topics/text-extraction)

Mi criterio sería:

- **Sí a Scribe.js** para MVP y probablemente también para producción inicial.[](https://github.com/topics/text-extraction)
    
- **No a Python en Vercel** salvo que ya sepas que necesitas un parser externo más pesado.
    
- **La calidad final la va a marcar más tu normalizador de texto que el motor OCR en sí.**[](https://www.perplexity.ai/search/069cb3a1-159f-45a1-8698-3ca9b63ee798)
    

Te propongo una siguiente decisión muy concreta: ¿quieres que te dé ahora un diseño de implementación para **Next.js App Router** con una función `extractAndCleanPdf()` en TypeScript, pensado para guardar en Mongo `rawText`, `cleanText`, `ocrUsed` y `qualityScore`?
------------------------------------------------------------------

me sirve con scribe. js pero como llevo idea de hacer más operaciones con los PDF , dime qué otras funcionalidades me ofreces scribe. js, también dime si es gratuito o no
----------------------------------------
Sí, te sirve para más cosas, pero con un matiz importante: **Scribe.js está muy orientado a OCR/extracción y a escribir una capa de texto buscable en PDFs**, no a edición PDF completa tipo Acrobat.

## Qué hace Scribe.js

Las funciones que sí te aporta, según el repo y la documentación, son estas: extraer texto de PDFs que ya tienen capa de texto, hacer OCR sobre PDFs escaneados o imágenes, y añadir una capa de texto invisible de alta calidad para que el PDF quede buscable.  
También está pensado para funcionar en JavaScript/Node y tiene ejemplos para integración en frameworks, lo que te viene bien para Next.js.[](https://github.com/scribeocr/scribe.js/)

## Qué te puede resolver en tu caso

Para un pipeline de RAG, las partes más útiles son:

- **Extraer texto nativo** cuando el PDF ya lo trae.[](https://github.com/scribeocr/scribe.js/)
    
- **OCR** cuando el PDF es una imagen escaneada.
    
- **Generar una versión indexable/buscable** del PDF con capa de texto invisible.
    

Eso encaja muy bien con tu idea de dejar el texto lo más limpio posible antes de chunking.[](https://www.perplexity.ai/search/069cb3a1-159f-45a1-8698-3ca9b63ee798)

## Qué no es

No es, por lo que se ve, una librería de “PDF management” amplia para: reorganizar páginas, firmar, rellenar formularios, fusionar/dividir PDFs, editar contenido arbitrario o manipular annotations a nivel avanzado. Lo fuerte de Scribe.js es la **extracción + OCR + text layer**.

## Si además quieres más operaciones

Si tu roadmap incluye muchas operaciones PDF distintas, probablemente acabes combinando Scribe.js con otra librería más generalista para tareas estructurales. Scribe.js se quedaría como el motor de ingestión textual, y otra herramienta cubriría merge, split, rotación, metadata, redacción o renderizado.

## ¿Es gratuito?

Sí: el proyecto se publica como **open source** y su web principal se presenta como gratuito y de código abierto.[](https://scribeocr.com/)  
Pero hay una salvedad clave: el repositorio de GitHub de Scribe.js indica licencia **AGPL-3.0**. Eso significa que puedes usarlo gratis, pero si lo integras en una app distribuida o servida en red, tienes que revisar bien las implicaciones de licencia para tu caso.[](https://github.com/scribeocr/scribe.js/)

## Mi lectura práctica

Para tu escenario yo lo vería así: **gratis sí**, pero con licencia fuerte; **muy útil** para extracción, OCR y preparación de texto para RAG; **no suficiente** si quieres convertirlo en tu suite PDF principal.  
Si el objetivo es “ingesta documental + RAG”, Scribe.js encaja muy bien. Si el objetivo es “plataforma PDF completa”, lo normal es complementarlo con otra librería.[](https://github.com/scribeocr/scribe.js/blob/master/docs/scribe_vs_tesseract.md)

¿Quieres que te diga qué librerías combinaría con Scribe.js para cubrir split, merge, rotación y extracción de metadatos en un stack Next.js/Vercel?

--------------------------
quería añadir funciones básicas como separar o juntar páginas antes de pasar al rag, por ejemplo, para no ingresar un PDF enorme que solo quiero tres páginas. también me gustaría poder decidir qué un texto no hay que extraerlo, por ejemplo, quiero ingestar el capítulo 3 de un documento, pero este empieza a mitad de una página y eso implica que está el final del capítulo 2, que no me interesa. no requiero firmar documentos , ni subrayar y otra funciones
------------------------------------

Sí, para ese caso lo montaría con **dos piezas**: **Scribe.js** para extraer/OCR y **pdf-lib** para recortar el PDF antes de ingestarlo. pdf-lib permite añadir, insertar, eliminar, extraer, dividir y fusionar páginas en JavaScript puro, así que encaja muy bien con Next.js/Vercel y sin meter binarios raros.

## Stack recomendado

La combinación práctica sería esta:

- **pdf-lib** para operaciones previas al RAG: seleccionar páginas, separar páginas concretas, crear un PDF reducido y juntar varios PDFs o fragmentos.
    
- **Scribe.js** para extraer texto del PDF ya recortado, usando texto nativo si existe y OCR si hace falta.
    

Eso te permite no pasarle al pipeline un PDF enorme cuando solo te interesan tres páginas. En vez de extraer de todo el documento y luego filtrar, primero generas un sub-PDF y luego procesas solo eso.

## Tu caso del capítulo 3

Para “quiero el capítulo 3, pero empieza a mitad de página y antes hay cola del capítulo 2”, el recorte por páginas **no basta** por sí solo. Ahí necesitas una segunda capa: extracción del texto de esas páginas y luego **recorte lógico por delimitadores** dentro del texto.

La forma más robusta sería:

1. Seleccionas el rango aproximado de páginas con pdf-lib.[](https://pdf-lib.js.org/)
    
2. Extraes texto con Scribe.js.[](https://github.com/scribeocr/scribe.js/)
    
3. Aplicas reglas de recorte tipo “empieza en `Capítulo 3`” y “termina antes de `Capítulo 4`”, o incluso “ignora todo lo anterior al primer match”.[](https://www.perplexity.ai/search/069cb3a1-159f-45a1-8698-3ca9b63ee798)
    
4. Solo ese texto limpio pasa a chunking.[](https://www.perplexity.ai/search/069cb3a1-159f-45a1-8698-3ca9b63ee798)
    

## Funciones concretas que te montaría

Con lo que has dicho, yo implementaría estas opciones básicas en la UI y backend:

- **Seleccionar páginas manualmente**, por ejemplo `12-15, 18, 21-22`. pdf-merger-js incluso documenta esa idea de fusionar partes de documentos por rangos, y está construido sobre pdf-lib.[](https://github.com/nbesli/pdf-merger-js)
    
- **Extraer sub-PDF** con solo esas páginas para previsualizar y guardar. pdf-lib soporta copiar páginas de un PDF origen a uno nuevo.
    
- **Unir PDFs o fragmentos** antes de extraer texto, por si el usuario quiere construir un documento lógico a partir de varias piezas.
    
- **Recorte por texto de inicio/fin**, por ejemplo “desde `3. Arquitectura` hasta `4. Resultados`”. Eso ya no te lo da pdf-lib ni Scribe.js como feature de alto nivel; es una capa tuya de limpieza/filtrado tras la extracción.
    

## Qué haría yo en producto

Yo no intentaría resolver “capítulo exacto” solo con páginas, porque en documentos reales te comerás cabeceras, restos del capítulo anterior, índices o notas al pie. Haría un flujo con dos niveles: **filtro físico** por páginas y **filtro semántico** por texto.[](https://www.perplexity.ai/search/069cb3a1-159f-45a1-8698-3ca9b63ee798)

Ejemplo de pipeline útil:

- Paso 1: “Elige páginas 40-52”.
    
- Paso 2: “Empieza a ingerir desde `Capítulo 3`”.
    
- Paso 3: “Detén la ingesta en `Capítulo 4`”.
    
- Paso 4: limpiar headers, footers y numeración antes del chunking.[](https://www.perplexity.ai/search/069cb3a1-159f-45a1-8698-3ca9b63ee798)
    

## Recomendación final

Para lo que necesitas, **Scribe.js solo no basta**, pero **Scribe.js + pdf-lib** sí encaja muy bien. Scribe.js te cubre la parte textual/OCR, y pdf-lib la manipulación básica de páginas que quieres antes del RAG.

La arquitectura más sensata para Vercel sería:

- `pdf-lib` para preparar el subconjunto del PDF.[](https://pdf-lib.js.org/)
    
- `Scribe.js` para extraer/OCR.[](https://github.com/scribeocr/scribe.js/)
    
- Tu propia capa TypeScript para “ignorar texto antes/después de X”, limpieza y chunking.[](https://www.perplexity.ai/search/069cb3a1-159f-45a1-8698-3ca9b63ee798)
    

Te diría que, con tus requisitos, esa combinación es probablemente la más equilibrada en complejidad/resultado dentro de Next.js. ¿Quieres que te proponga ya la **estructura exacta de módulos** para esto, por ejemplo `pdfSelectPages()`, `pdfMerge()`, `extractPdfText()`, `trimByMarkers()` y `cleanForRag()`?

-------------------------------
qué funcionalidades ofrece PDF-lib?
--------------------------------
pdf-lib es una librería JavaScript gratuita y de código abierto para **crear y modificar PDFs** en cualquier entorno JS (Node, navegador, React Native, etc.). No hace OCR ni extrae texto; su fuerte es **manipulación estructural y contenido** dentro del PDF.

## Funcionalidades principales

## Creación y modificación

- **Crear PDF desde cero** sin dependencias externas.
    
- **Modificar PDF existente**: agregar, eliminar y reorganizar páginas, editar contenido.
    

## Gestión de páginas

- **Insertar, añadir, eliminar páginas** y **reordenarlas**.[](https://pdf-lib.js.org/)
    
- **Separar/split**: dividir un PDF en varios archivos.[](https://pdf-lib.js.org/)
    
- **Juntar/merge**: fusionar múltiples PDFs en uno.
    
- **Extraer páginas concretas**: crear un sub-PDF con solo páginas seleccionadas.[](https://pdf-lib.js.org/)
    

## Contenido y dibujo

- **Dibujar texto** con control de tamaño, grosor, estilo, color.
    
- **Dibujar imágenes**.[](https://pdf-lib.js.org/)
    
- **Dibujar gráficos vectoriales** e **incrustar/dibujar páginas PDF** (por ejemplo, copiar páginas de otro PDF).[](https://pdf-lib.js.org/)
    
- **Incrustar rutas SVG** y gráficos propios.[](https://products.documentprocessing.com/es/editor/javascript/pdf-lib/)
    
- **Incrustar fuentes propias** (custom fonts).[](https://pdf-lib.js.org/)
    

## Formularios PDF

- **Crear formularios interactivos** con campos de texto, opciones, casillas, menús desplegables, listas.[](https://products.documentprocessing.com/es/editor/javascript/pdf-lib/)
    
- **Rellenar formularios PDF** programáticamente.
    
- **Aplanar formularios** para que no sean editables.[](https://products.documentprocessing.com/es/editor/javascript/pdf-lib/)
    

## Manipulación general

- **Agenda de operaciones**: modificar PDFs de forma compleja sin reescribir todo el archivo.[](https://pdf-lib.js.org/)
    
- **Reparar y optimizar** PDFs de entrada (en ciertos casos).[](https://www.componentsource.com/es/product/pdflib-net)
    

## Qué NO hace pdf-lib

No extrae texto, no hace OCR, no visualiza ni representa páginas en pantalla.  
Para eso necesitas otra librería o servicio (por ejemplo, Scribe.js para OCR y extracción).[](https://github.com/scribeocr/scribe.js/)

## En tu caso

Con lo que necesitas:

- **Separar/juntar páginas** antes del RAG → pdf-lib lo cubre perfectamente.
    
- **Crear un PDF pequeño con solo 3 páginas** → pdf-lib soporta extraer subconjunto de páginas.[](https://pdf-lib.js.org/)
    
- **Extraer texto y hacer OCR** → pdf-lib no lo hace; lo harías con Scribe.js después.
    
- **Decidir qué texto no extraer** (corona del capítulo 2) → eso lo resuelves en tu capa de limpieza/recorte lógico tras la extracción, no en pdf-lib.
    

La combinación ideal sería **pdf-lib + Scribe.js**: pdf-lib para construir el PDF que quieres ingerir, y Scribe.js para extraer el texto limpio para RAG.

---------------
si quisiese hacer, independientemente del ocr y del rag, por ejemplo, un pequeño editor web de PDF o convertidor de texto o . md a PDF, me serviría pdf-lib? tendría que crearme mi interface o serviría una suya, en ese caso, puedo adaptarla a mi estilo?
-------------------------------------
Sí, **pdf-lib te serviría como motor**, pero no como editor web “listo para usar”. pdf-lib es una librería para crear y modificar PDFs en JavaScript; no trae una interfaz visual propia, así que si quieres un editor web tendrás que construir tú la UI o integrarla con otras piezas como un visor/renderizador.

## Editor web de PDF

Para un pequeño editor web, pdf-lib encaja bien si tus operaciones son del tipo: añadir/eliminar/reordenar páginas, insertar texto o imágenes, rellenar formularios y generar un PDF nuevo.  
Pero no trae toolbar, panel lateral, selección visual ni canvas de edición; cuando la gente monta un editor en navegador con pdf-lib, normalmente usa además **PDF.js** para renderizar/ver páginas y encima crea una interfaz propia.[](https://www.nutrient.io/blog/how-to-build-a-javascript-pdf-editor/)[](https://www.youtube.com/watch?v=v6tEcl0ia5I&vl=es)

Eso, en tu caso, es incluso una ventaja: puedes hacer una UI totalmente alineada con tu estilo en Next.js, sin pelearte con una interfaz cerrada. Como pdf-lib es una librería de bajo nivel, el look & feel lo controlas tú por completo.

## Conversor de texto o Markdown a PDF

Aquí depende del tipo de resultado que quieras. Con pdf-lib **sí puedes generar un PDF desde texto o desde contenido que tú ya hayas transformado**, dibujando texto, imágenes y maquetación manualmente.  
Pero pdf-lib **no es un conversor Markdown-to-PDF de alto nivel**: no interpreta Markdown por sí mismo ni te da estilos automáticos de títulos, listas, tablas o saltos de página elegantes.

Si quieres convertir `.md` a PDF con buen formato, suele ser más práctico usar un pipeline pensado para eso, como un conversor Markdown dedicado o HTML/CSS + motor de render a PDF. Hay paquetes específicos para Markdown a PDF, por ejemplo plugins sobre jsPDF o herramientas como `md-to-pdf`, que ya resuelven parsing y maquetado.

## Qué haría según el caso

Yo lo separaría así:

- **Editor PDF básico en web**: sí usaría `pdf-lib` como backend lógico de edición.
    
- **Visor/interfaz visual**: lo construiría yo, probablemente apoyado en PDF.js para renderizar las páginas.[](https://www.youtube.com/watch?v=v6tEcl0ia5I&vl=es)[](https://www.nutrient.io/blog/how-to-build-a-javascript-pdf-editor/)
    
- **Markdown a PDF bonito**: no elegiría pdf-lib como pieza principal, salvo que quieras diseñar tú toda la maquetación.
    

## Sobre la interfaz

pdf-lib no trae una interfaz oficial que puedas “activar” y luego tematizar. Lo que ofrece es la API; la interfaz la haces tú.  
Eso significa que **sí, puedes adaptarla 100% a tu estilo**, pero precisamente porque la UI no existe de serie. Si quieres algo ya hecho y personalizable, tendrías que mirar SDKs comerciales o proyectos open source montados encima de visores PDF.

## Recomendación práctica

Con tus requisitos, yo usaría esta lógica:

- `pdf-lib` para operaciones PDF estructurales y edición básica.[](https://pdf-lib.js.org/)
    
- `PDF.js` para mostrar páginas y permitir selección visual en el navegador.[](https://www.youtube.com/watch?v=v6tEcl0ia5I&vl=es)
    
- Otro pipeline distinto para `.md` o texto a PDF si quieres conversión de buena calidad tipográfica.
    

En una frase: **pdf-lib sí te sirve como motor, pero no como producto terminado**. Para editor web tendrás que crear tú la UX, y para Markdown a PDF suele haber opciones más directas que pdf-lib.

¿Quieres que te diga cuál sería la combinación más equilibrada para tu caso entre **pdf-lib + PDF.js** frente a usar una solución más “todo en uno”?

------------------------------
cómo te comento son ideas que llevo en la cabeza , un poco dispersas. el convertidor . md a PDF sería aplicando algún tipo de plantilla, para poder poner el logo, los colores y las fuentes que se quiera, hay algo para eso?
-------------------------------

Sí: para un **.md a PDF con plantilla** hay varias opciones, y **sí existe** la posibilidad de meter logo, colores, tipografías, cabeceras y pies. La clave es elegir si quieres una solución basada en **HTML/CSS** o una solución basada en **componentes PDF**.

## Lo más práctico

Para tu caso, la vía más flexible suele ser **Markdown → HTML → PDF** usando una plantilla HTML/CSS. Herramientas como `md-to-pdf` convierten Markdown a HTML y luego a PDF con Chromium/Puppeteer, y son “hackable”, justo para personalizar estilos y branding.[](https://github.com/simonhaenisch/md-to-pdf)

Ese enfoque te deja controlar:

- Logo en cabecera o portada.[](https://raw-fi-data.com/blog/markdown-to-pdf)
    
- Colores corporativos vía CSS.
    
- Fuentes propias o de marca.[](https://raw-fi-data.com/blog/markdown-to-pdf)
    
- Márgenes, numeración, header/footer y diseño por tipo de documento.[](https://raw-fi-data.com/blog/markdown-to-pdf)
    

## Qué usaría yo

Yo contemplaría estas dos rutas:

|Ruta|Cuándo elegirla|Ventajas|Pegas|
|---|---|---|---|
|**Markdown + HTML/CSS + Puppeteer/md-to-pdf**|Si quieres plantillas visuales tipo “documento corporativo”|Muy flexible para logo, colores, fuentes, portada, headers/footers y distintas plantillas.|En Vercel puede requerir más cuidado por Chromium/headless. [](https://github.com/simonhaenisch/md-to-pdf)|
|**React-pdf**|Si quieres generar PDFs desde componentes React con control programático|Permite registrar fuentes y definir estilos propios desde código. [](https://react-pdf.org/fonts)|No trabaja tan natural con CSS/HTML completo como la ruta HTML→PDF. [](https://react-pdf.org/fonts)|

## Sobre las plantillas

Sí, puedes montar un sistema de plantillas del tipo:

- `corporate-blue`
    
- `legal-clean`
    
- `technical-report`
    
- `minimal-letter`
    

Cada plantilla podría definir: logo, paleta, familias tipográficas, portada, estilo de títulos, tablas, bloque de advertencias, cabecera, pie y numeración. Eso encaja muy bien con un pipeline Markdown → HTML → PDF porque el Markdown aporta el contenido y la plantilla decide la presentación.

## Fuentes, logo y branding

Eso también está cubierto. En soluciones HTML/CSS para PDF puedes meter **logos en header/footer**, imágenes embebidas o externas, colores de fondo y tipografías personalizadas; incluso hay ejemplos explícitos de logos, cabeceras y pies personalizados con HTML.  
En React-pdf también puedes registrar fuentes personalizadas y aplicar estilos desde código, aunque el modelo es más “componentes” que “plantilla CSS”.

## Qué no usaría como primera opción

Para esto, **pdf-lib no sería mi primera elección**. Puede generar PDFs y dibujar texto/imágenes, pero si quieres un sistema de plantillas de marca con estilo rico, la vía HTML/CSS o React-pdf es bastante más natural.

## Recomendación concreta

Con lo que cuentas, yo haría esto:

- Para **editor/manipulación de páginas PDF**: `pdf-lib`.[](https://pdf-lib.js.org/)
    
- Para **Markdown a PDF con plantillas de marca**: `md-to-pdf` o un pipeline propio Markdown → HTML plantilla → Puppeteer PDF.
    
- Si quieres algo más “React nativo” y menos dependiente de HTML/CSS, entonces `@react-pdf/renderer`.[](https://react-pdf.org/fonts)
    

Mi apuesta para ti sería la ruta **Markdown → HTML + plantillas CSS + PDF**, porque es la que mejor te deja crear un sistema de branding reutilizable.

Una forma mental simple de verlo:

- **pdf-lib** = “motor PDF de bajo nivel”.[](https://pdf-lib.js.org/)
    
- **md-to-pdf / Puppeteer** = “maquetación bonita con plantillas”.[](https://github.com/simonhaenisch/md-to-pdf)
    
- **React-pdf** = “documentos programados como componentes”.[](https://react-pdf.org/fonts)
    

¿Quieres que te proponga una arquitectura concreta de **plantillas Markdown corporativas** para Next.js, con varios themes y campos como logo, colores, portada, cabecera y pie?

--------------------------------
md-to-pdf permite algún tipo de control de viudad, huérfanas, que los títulos no se queden colgados al final de una página y cosas así?
-------------------------
`md-to-pdf` **no tiene una opción nativa específica** llamada “control de viudas y huérfanas” como en Word, pero sí permite **controlar saltos de página y comportamiento de maquetación** a través de CSS, que es justamente donde se solucionan ese tipo de problemas.

## Qué tienes disponible

Al usar `md-to-pdf`, el Markdown se convierte a HTML y luego se renderiza a PDF con Chromium/Puppeteer. Eso significa que cualquier **CSS de maquetación** que uses en HTML normal también funciona aquí.[](https://github.com/simonhaenisch/md-to-pdf)

Con CSS puedes controlar:

## Viudas y huérfanas

css

`/* Evita que queden líneas sueltas al principio/final de página */ p {   orphans: 3; /* mínimo 3 líneas al final de página */  widows: 3;  /* mínimo 3 líneas al inicio de página */ }`

Eso obliga a mantener bloques de párrafo juntos y evita líneas viudas/huérfanas.

## Títulos que no se queden colgados

css

`/* Evita que un título quede al final de página sin contenido debajo */ h1, h2, h3, h4, h5, h6 {   page-break-after: avoid;  orphans: 2; }`

Igualmente, para evitar que un título se deje solo en la parte inferior, usas `page-break-after: avoid` y fuerzas enlace con el párrafo siguiente.[](https://hackmd.io/@dprieto/pdf-salto-linea)

## Saltos de página inteligentes

css

`/* Forzar salto antes de secciones */ h2 {   page-break-before: always; } /* Evitar saltos dentro de bloques */ div {   page-break-inside: avoid; }`

Puedes añadir saltos forzados en el Markdown con HTML: `<div style="page-break-after: always;"></div>`.

## Límites reales

Lo que `md-to-pdf` **no hace** es:

- Control automático avanzado de viudas/huérfanas por algoritmo.
    
- Rehacer el layout completo para evitar estos problemas.
    

Lo que **sí hace** es renderizar con CSS normal, así que el control lo tienes tú con reglas CSS. Si necesitas un control más fino, tendrías que añadir postprocesamiento o saltos manuales estratégicos.[](https://github.com/simonhaenisch/md-to-pdf)

## Mi recomendación práctica

Para tu caso, usaría esta estrategia:

1. **CSS base para texto** con control de viudas/huérfanas:
    

css

`body {   font-family: 'TuFuente'; } p {   orphans: 3;  widows: 3;  margin-bottom: 1em; } h1, h2, h3 {   page-break-after: avoid;  orphans: 2; } /* Evitar saltos dentro de cajas */ div, blockquote, table {   page-break-inside: avoid; }`

2. **Saltos forzados** en puntos clave con HTML en el Markdown.
    
3. **Tema de plantillas** donde cada plantilla define su propio CSS, con logo, colores y fuentes.[](https://github.com/simonhaenisch/md-to-pdf)
    

Si quieres, te puedo montar un **ejemplo de archivo CSS plantilla** listo para usar con `md-to-pdf`, con control de viudas/huérfanas, estilos de títulos, y espacios para logo y colores corporativos.

Sí. Una forma bastante sólida es montar una **plantilla CSS reutilizable** y pasarla a `md-to-pdf`, porque esta herramienta está pensada para ser “hackable” y admite personalización del resultado con estilos; además, en flujos de este tipo el CSS y las opciones de Puppeteer se usan precisamente para controlar formato, márgenes, fondos y cabeceras/pies.

## Plantilla base

Este ejemplo está pensado para:

- marca corporativa,
    
- tipografía limpia,
    
- buen espaciado,
    
- evitar títulos colgados,
    
- minimizar viudas y huérfanas,
    
- y dejar sitio para logo/cabecera/pie.
    

css

`/* template-corporate.css */ @page {   size: A4;  margin: 22mm 16mm 20mm 16mm; } /* Variables de marca */ :root {   --color-text: #1f2937;  --color-muted: #6b7280;  --color-primary: #0f766e;  --color-secondary: #0b3b66;  --color-border: #d1d5db;  --color-code-bg: #f3f4f6;  --color-callout-bg: #eef6f5;   --font-body: "Inter", "Segoe UI", Arial, sans-serif;  --font-heading: "Merriweather", Georgia, serif;  --font-mono: "JetBrains Mono", "Consolas", monospace;   --logo-height: 28px;  --base-size: 11pt;  --line-height: 1.55; } html {   font-size: var(--base-size); } body {   font-family: var(--font-body);  color: var(--color-text);  line-height: var(--line-height);  -webkit-print-color-adjust: exact;  print-color-adjust: exact; } /* Portada opcional */ .cover {   page-break-after: always;  min-height: 90vh;  display: flex;  flex-direction: column;  justify-content: center; } .cover__logo {   max-height: 56px;  width: auto;  margin-bottom: 20px; } .cover__title {   font-family: var(--font-heading);  font-size: 30pt;  line-height: 1.1;  margin: 0 0 12px;  color: var(--color-secondary); } .cover__subtitle {   font-size: 14pt;  color: var(--color-muted);  margin: 0 0 24px; } .cover__meta {   font-size: 10pt;  color: var(--color-muted); } /* Tipografía */ h1, h2, h3, h4, h5, h6 {   font-family: var(--font-heading);  color: var(--color-secondary);  line-height: 1.2;  page-break-after: avoid;  break-after: avoid-page;  orphans: 2;  widows: 2; } h1 {   font-size: 22pt;  margin: 0 0 14pt;  padding-bottom: 6pt;  border-bottom: 2px solid var(--color-primary); } h2 {   font-size: 17pt;  margin: 24pt 0 10pt;  padding-bottom: 3pt;  border-bottom: 1px solid var(--color-border); } h3 {   font-size: 14pt;  margin: 18pt 0 8pt; } h4, h5, h6 {   font-size: 12pt;  margin: 14pt 0 6pt; } p, li, blockquote, td, th {   orphans: 3;  widows: 3; } p {   margin: 0 0 10pt;  text-align: justify;  hyphens: auto; } /* Listas */ ul, ol {   margin: 0 0 12pt 20pt; } li {   margin: 0 0 4pt; } /* Citas */ blockquote {   margin: 14pt 0;  padding: 10pt 14pt;  border-left: 4px solid var(--color-primary);  background: var(--color-callout-bg);  color: #334155;  page-break-inside: avoid;  break-inside: avoid; } /* Código */ code, pre {   font-family: var(--font-mono); } pre {   background: var(--color-code-bg);  border: 1px solid var(--color-border);  border-radius: 8px;  padding: 12pt;  overflow: hidden;  page-break-inside: avoid;  break-inside: avoid;  white-space: pre-wrap; } code {   background: var(--color-code-bg);  padding: 1px 4px;  border-radius: 4px;  font-size: 0.92em; } /* Tablas */ table {   width: 100%;  border-collapse: collapse;  margin: 14pt 0;  page-break-inside: auto; } thead {   display: table-header-group; } tr {   page-break-inside: avoid;  break-inside: avoid; } th, td {   border: 1px solid var(--color-border);  padding: 7pt 8pt;  vertical-align: top; } th {   background: #eef2f7;  text-align: left; } /* Imágenes */ img {   max-width: 100%;  height: auto;  page-break-inside: avoid;  break-inside: avoid; } /* Regla útil para bloques que no deben partirse */ .avoid-break {   page-break-inside: avoid;  break-inside: avoid; } /* Si quieres forzar salto manual desde el HTML incrustado en Markdown */ .page-break {   page-break-after: always;  break-after: page; }`

## Cómo usarla

La idea es pasar este CSS como hoja de estilo personalizada al flujo de conversión. `md-to-pdf` admite personalización de estilo y los flujos de conversión Markdown→PDF suelen exponer también opciones PDF como márgenes, `printBackground` y cabecera/pie vía Puppeteer.

En práctica, tu arquitectura podría ser:

- `templates/corporate.css`
    
- `templates/legal.css`
    
- `templates/technical.css`
    
- `assets/logo.svg`
    

Y luego eliges plantilla por documento según metadata o formulario. Esa aproximación encaja muy bien con un sistema de branding reutilizable para varios tipos de informe.

## Cabecera y pie

Si quieres meter logo, título del documento, fecha o numeración en todas las páginas, eso normalmente se resuelve con opciones de cabecera/pie del motor PDF y/o con HTML específico para header/footer. Hay documentación y ejemplos de conversiones Markdown/PDF con `header`, `footer`, estilos y plantillas HTML/CSS.

Una opción típica sería:

- portada en HTML/CSS dentro del contenido,
    
- cuerpo maquetado con la plantilla,
    
- header/footer generados por el motor de PDF con número de página y marca.
    

## Limitaciones reales

Este CSS ayuda mucho, pero no hace milagros tipográficos de InDesign. Chromium respeta muchas reglas útiles como `break-inside`, `page-break-after: avoid` y estilos de impresión, pero el control fino absoluto de paginación sigue siendo limitado comparado con motores editoriales más avanzados.

Aun así, para informes corporativos, memorias técnicas, documentación y manuales internos, esta vía suele dar resultados bastante buenos con una inversión razonable.

## Lo que haría yo

Yo montaría un sistema así:

- Markdown con frontmatter, por ejemplo `title`, `subtitle`, `template`, `logo`, `primaryColor`.
    
- Render a HTML con una plantilla base.
    
- CSS de tema seleccionable.
    
- Generación PDF con opciones comunes de impresión.
    

Ejemplo mental de frontmatter:

text

`--- title: Informe técnico subtitle: Estado del sistema template: corporate primaryColor: "#0f766e" logo: "./assets/logo.svg" author: "Tu empresa" date: "2026-06-03" ---`

Con eso ya puedes construir algo bastante elegante y repetible.[](https://michaelnthiessen.com/create-beautiful-pdfs-with-html-css-and-markdown)

¿Quieres que en el siguiente paso te deje un ejemplo completo de **Markdown + frontmatter + plantilla HTML** pensado para Next.js, en vez de solo el CSS?

----------------------
la aplicación es multitenant, por lo tanto, los assets y los css no podrían estar en el código, estarían en un repositorio tipo cloudinary
------------------------
Sí, eso encaja perfectamente con una app multitenant. En ese caso, lo correcto no es tener un CSS “fijo” en el repo, sino **resolver una plantilla por tenant en tiempo de ejecución**, cargando assets y estilos desde almacenamiento externo o desde una configuración en base de datos. `md-to-pdf` trabaja sobre HTML/CSS y Puppeteer, así que mientras las URLs sean accesibles en el momento de renderizar, puedes usar CSS remotos, logos remotos y otros recursos de marca.

## Cómo lo montaría

Yo separaría tres capas por tenant:

- **Configuración** en MongoDB: colores, fuentes, logo, nombre comercial, márgenes, header/footer, plantilla activa.
    
- **Assets** en Cloudinary o similar: logo, imagen de portada, quizá tipografías si decides servirlas así. Cloudinary permite servir recursos remotos y transformarlos, y Puppeteer puede incluir imágenes remotas siempre que sean accesibles.
    
- **Plantilla base** en tu app: una estructura HTML común con variables dinámicas, no un CSS cerrado por tenant.
    

## Lo mejor para multitenant

En vez de guardar un CSS entero por tenant como archivo suelto, yo haría esto:

- Mantener **una o varias plantillas base** en tu aplicación.
    
- Guardar por tenant solo **tokens de marca** y opciones: `primaryColor`, `secondaryColor`, `fontBody`, `fontHeading`, `logoUrl`, `headerHtml`, `footerHtml`, `pageMargins`, `theme`.
    
- En tiempo de render, generas el HTML y el CSS final interpolando esos valores.
    

Ese modelo te da mucho más control, evita CSS arbitrario roto y sigue permitiendo personalización fuerte. Además, es más fácil sanear y versionar.

## Qué sí puede estar fuera

Puedes tener fuera del código:

- Logos y fondos en Cloudinary.[](https://davidwalsh.name/cloudinary-fetch)[](https://www.youtube.com/watch?v=7LwwnqbOM48)
    
- CSS temático remoto si quieres, siempre que Puppeteer pueda cargarlo.
    
- Incluso HTML de cabecera/pie parametrizable, aunque yo ahí sería más estricto por seguridad.[](https://docupotion.com/blog/generate-pdfs-puppeteer)
    

Pero yo no dejaría que cada tenant suba un CSS completamente libre sin validación. En una app multitenant eso puede romper el layout, generar PDFs inconsistentes y complicarte muchísimo el soporte. Lo sensato es permitir personalización por **variables y plantillas controladas**.

## Arquitectura recomendable

Una arquitectura sana sería esta:

1. El usuario elige tenant y plantilla.
    
2. Tu backend carga branding y assets desde Mongo + Cloudinary.[](https://davidwalsh.name/cloudinary-fetch)
    
3. Generas un HTML temporal con variables CSS inline o con una hoja montada al vuelo.
    
4. `md-to-pdf` o el motor HTML→PDF renderiza ese HTML con `printBackground: true` y espera a que imágenes y estilos remotos carguen antes de generar el PDF. Ese detalle es importante porque Puppeteer puede fallar si CSS o imágenes no están listas aún.
    

## Lo que haría yo en tu caso

Dado que es multitenant, yo evitaría un sistema tipo “cada cliente sube su CSS completo”. Haría un sistema de **branding declarativo** con estructura como esta:

- `tenantId`
    
- `templateId`
    
- `logoUrl`
    
- `coverImageUrl`
    
- `primaryColor`
    
- `secondaryColor`
    
- `fontHeading`
    
- `fontBody`
    
- `headerMode`
    
- `footerMode`
    
- `pageSize`
    
- `margins`
    

Y luego una capa interna convierte eso en CSS real. Así mantienes control, coherencia y posibilidad de evolucionar plantillas sin tocar los datos de cada tenant.[](https://michaelnthiessen.com/create-beautiful-pdfs-with-html-css-and-markdown)

## Respuesta corta

Sí, puedes tener **assets y estilos fuera del código** y resolverlos desde Cloudinary u otro almacenamiento remoto en una app multitenant.  
Pero, para hacerlo bien, yo no guardaría “CSS libre” por tenant, sino **branding tokens + plantillas controladas**, y generaría el CSS final en tiempo de ejecución.

Si quieres, en el siguiente paso te puedo proponer un **modelo de datos MongoDB para plantillas PDF multitenant**, con ejemplo de documento `tenantBranding` y cómo convertirlo en HTML/CSS para `md-to-pdf`.

--------------------------------
y si un cliente que no es muy importante quiere crearse algo especial? creo un editor web de esos html/css para controlar que no cree nada raro? no quiero que inyecte nada
-------------------------
Sí, **esa es justo la dirección correcta**: no dejar HTML/CSS libre, sino crear un **editor web acotado** que genere una plantilla segura. Si no quieres inyección, lo mejor no es “sanear cualquier cosa que suba el cliente”, sino **no permitirle escribir HTML/CSS arbitrario en primer lugar**.

## Enfoque recomendado

Yo haría un **builder declarativo**, no un editor libre. En vez de dejar que el cliente toque HTML o CSS, le dejas configurar cosas como: logo, colores, tipografías, portada sí/no, estilo de títulos, cabecera, pie, márgenes y algunos bloques opcionales. Luego tu backend traduce eso a una plantilla conocida.[](https://www.reddit.com/r/css/comments/oob53o/best_way_to_apply_styles_for_a/)

Eso reduce muchísimo el riesgo, porque tú controlas toda la estructura HTML y casi todo el CSS. El usuario solo rellena campos y elige opciones dentro de una allowlist.

## Qué no haría

No dejaría a un cliente “poco importante” subir CSS libre esperando sanearlo después. Sanitizar HTML ya es delicado; sanitizar CSS arbitrario también lo es, porque puede meter `url()`, imports, overlays raros o estilos que rompan la salida, y la discusión de seguridad suele acabar en allowlists muy estrictas.

Tampoco confiaría en “pasarlo por DOMPurify y listo” si el objetivo es permitir estilos avanzados. DOMPurify es útil para HTML no confiable, pero incluso en ecosistemas reales se considera más seguro **bloquear `style` tags y atributos de estilo** por defensa en profundidad.

## Qué editor sí haría

Haría un editor con este tipo de controles:

- Selección de **plantilla base**: informe, propuesta, manual, carta.
    
- **Logo** y assets desde Cloudinary.[](https://davidwalsh.name/cloudinary-fetch)
    
- Paleta: color primario, secundario y acento.
    
- Tipografías desde una allowlist cerrada.
    
- Opciones de layout: márgenes, densidad, portada, header/footer, numeración.
    
- Bloques permitidos: portada, callout, tabla, cita, anexos, disclaimer.
    
- Reglas de contenido: “salto antes de H1”, “evitar cortar tablas”, “mostrar índice”.
    

Eso ya da bastante libertad sin ceder el control del DOM ni del CSS.

## Modelo seguro

La idea buena es guardar algo así como un **JSON de tema** y no HTML/CSS crudo. Por ejemplo:

- `templateId`
    
- `logoUrl`
    
- `primaryColor`
    
- `fontHeading`
    
- `fontBody`
    
- `headerVariant`
    
- `footerVariant`
    
- `coverEnabled`
    
- `tocEnabled`
    
- `spacingScale`
    

Con eso generas el HTML/CSS tú, en servidor. Este patrón encaja además muy bien con multi-tenant, porque puedes versionar plantillas, validar campos y evitar que un tenant rompa el sistema.[](https://www.reddit.com/r/css/comments/oob53o/best_way_to_apply_styles_for_a/)

## Si quieres dar “algo especial”

Si de verdad quieres dejar cierta personalización avanzada, yo haría **dos niveles**:

- **Nivel estándar**: solo tokens y opciones cerradas.
    
- **Nivel avanzado revisado**: permites pequeños fragmentos de contenido enriquecido, pero siempre saneados y dentro de contenedores limitados.
    

Incluso ahí, evitaría HTML/CSS completo. Como mucho permitiría Markdown extendido o bloques predefinidos con parámetros, no código libre.

## Si aun así aceptas HTML

Si alguna vez aceptas HTML del usuario, entonces mínimo haría esto:

- Sanitización fuerte con allowlist de tags y atributos.[](https://theproductguy.in/blogs/html-sanitization-guide/)
    
- Bloquear `script`, `style`, eventos inline y URLs peligrosas.
    
- Interceptar red y limitar recursos externos al dominio permitido de assets.[](https://www.reddit.com/r/webdev/comments/1p6apqr/how_are_you_securely_converting_untrusted_invoice/)
    
- Desactivar JavaScript en el render PDF si el motor lo permite.[](https://www.reddit.com/r/webdev/comments/1p6apqr/how_are_you_securely_converting_untrusted_invoice/)
    

Pero sinceramente, para tu caso de plantillas corporativas, **yo no abriría esa puerta**.

## Recomendación concreta

Mi recomendación sería: **sí, crea un editor web, pero que edite configuración, no código**. Ese editor debería parecer visual, incluso “tipo Canva” en sensación, pero por debajo solo estar generando un objeto seguro que mapea a tus plantillas internas.

Eso te da tres ventajas claras:

- evita inyección,
    
- mantiene consistencia de marca y calidad de PDF,[](https://www.reddit.com/r/css/comments/oob53o/best_way_to_apply_styles_for_a/)
    
- y hace viable el soporte en una app multitenant.
    

La frase clave sería esta: **no dejes personalizar el HTML/CSS; deja personalizar el diseño a través de un schema controlado**.

¿Quieres que te diseñe ese schema, con campos concretos para MongoDB y niveles de permisos “básico” y “avanzado”?
----------------
es decir, crear un editor de plantillas y que las guarde en cloudinary y otro servicio, probablemente encriptadas para que no pueda manipularlas, no? habría ya creado algún editor de plantillas de este estilo , para no tener que reinventarlo?
------------------------
Sí, la idea correcta sería **crear un editor de plantillas controlado** y guardar **la definición de la plantilla** en tu backend o base de datos, mientras que Cloudinary lo dejaría para **assets** como logos, imágenes o fondos. Cloudinary no es el sitio natural para guardar la “lógica” de la plantilla; eso encaja mejor en MongoDB u otro almacenamiento propio donde puedas versionar, validar y aplicar permisos.[](https://davidwalsh.name/cloudinary-fetch)

## Qué guardaría dónde

Yo lo separaría así:

- **Cloudinary**: logos, portadas, fondos, iconos, imágenes.[](https://davidwalsh.name/cloudinary-fetch)
    
- **MongoDB/tu backend**: JSON de plantilla, tokens de diseño, bloques permitidos, versión, tenantId, permisos.
    
- **Opcionalmente cifrado**: útil si quieres proteger datos sensibles o evitar manipulación casual, pero la defensa principal no es cifrar para que “no lo toque”, sino **no confiar nunca en lo que vuelva del cliente** y validar siempre en servidor.[](https://theproductguy.in/blogs/html-sanitization-guide/)
    

Es decir: aunque cifres algo, si el usuario puede enviarte una nueva versión, igualmente tienes que validar schema, permisos y consistencia. El control real está en la validación del lado servidor y en que el renderer solo acepte un formato seguro.

## Sí existen editores ya hechos

Sí, ya hay herramientas para no reinventarlo todo. La más conocida y probablemente la más adaptable para tu idea es **GrapesJS**, que es un builder visual open source para crear plantillas HTML sin necesidad de que el usuario escriba código. Está pensado precisamente para embeberse dentro de otros productos y construir templates o páginas mediante bloques.

Además, GrapesJS tiene bloques, gestor de estilos y un canvas visual, así que puedes restringir mucho qué componentes existen y qué se puede tocar. Eso te permite acercarte a un “editor de plantillas” sin dar HTML/CSS libre.

## Otras opciones

También hay alternativas más orientadas a salida estructurada o JSON:

- **EmailBuilder.js** genera JSON o HTML y es block-based, lo que encaja bastante con la idea de almacenar una definición segura en vez de markup libre.
    
- **react-page-builder** va por la idea de bloques React + JSON, aunque parece más verde y menos maduro.[](https://github.com/undermuz/react-page-builder)
    
- **Builder.io** existe, pero ya es una pieza más grande y más de CMS visual/comercial que de editor simple embebido a medida.[](https://www.builder.io/m/react)
    

## Qué usaría yo

Para tu caso, yo haría una de estas dos:

|Opción|Cuándo la elegiría|Ventaja principal|Riesgo|
|---|---|---|---|
|**GrapesJS embebido**|Si quieres un editor visual tipo drag & drop relativamente maduro|Open source, flexible, pensado para templates HTML.|Tiende a empujar a HTML/CSS; tendrás que acotarlo bastante. [](https://github.com/GrapesJS/grapesjs)|
|**Editor propio sobre schema JSON**|Si priorizas seguridad, control y multi-tenant limpio|Máximo control y render seguro en servidor. [](https://theproductguy.in/blogs/html-sanitization-guide/)|Más trabajo inicial.|

## Lo importante para no reinventar mal

Mi recomendación no sería “usar GrapesJS tal cual y guardar el HTML final”. Yo lo usaría, si acaso, como **interfaz visual**, pero con restricciones:

- bloques cerrados,
    
- propiedades limitadas,
    
- sin `<script>`,
    
- sin CSS arbitrario,
    
- y exportando a un formato intermedio controlado o saneado.
    

Si dejas que GrapesJS te genere HTML libre y lo usas sin más, vuelves a abrir parte del problema. Lo inteligente es usarlo como frontend de edición, pero mantener un **modelo permitido** por detrás.

## Sobre cifrar

Yo no basaría la seguridad en cifrar las plantillas. Cifrar en reposo está bien, pero **no sustituye**:

- validación por schema,
    
- control por tenant,
    
- versionado,
    
- allowlist de bloques/propiedades,
    
- y render server-side seguro.
    

En otras palabras: **cifrado puede sumar, pero no es la barrera principal contra manipulación**. La barrera principal es que el renderer no acepte nada fuera del schema permitido.[](https://theproductguy.in/blogs/html-sanitization-guide/)

## Recomendación concreta

Si quieres avanzar rápido sin reinventarlo entero, mi mejor apuesta sería:

1. **GrapesJS** como base visual.[](https://github.com/GrapesJS/grapesjs)
    
2. Restringir componentes y estilos a una allowlist.[](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/72482)
    
3. Guardar la plantilla como **JSON estructurado** en MongoDB, no como CSS/HTML suelto en Cloudinary.
    
4. Guardar solo los assets en Cloudinary.[](https://davidwalsh.name/cloudinary-fetch)
    
5. Renderizar a HTML/PDF en servidor con una plantilla controlada.[](https://github.com/simonhaenisch/md-to-pdf)
    

La idea buena no es “editor + cifrado”, sino **editor acotado + schema seguro + assets externos**.

¿Quieres que te proponga una arquitectura concreta de este editor, por ejemplo “GrapesJS limitado + esquema JSON + renderer md-to-pdf/Puppeteer”?
---------------------------
sería mejor opción hacer un fork de grapesjs quitando opciones?
-------------------------
No; **en general no empezaría por un fork**. GrapesJS ya está diseñado para ser **extendable y customizable**, con APIs para quitar paneles, botones, bloques, comandos y hasta montar una UI propia alrededor del core, así que normalmente puedes recortarlo bastante sin mantener un fork doloroso.

## Mejor estrategia

Lo más razonable sería usar **GrapesJS como engine** y construir una capa tuya encima:

- quitar paneles y botones que no quieras,
    
- registrar solo tus bloques permitidos,
    
- desactivar uploads o managers innecesarios,
    
- ocultar vistas avanzadas,
    
- y guardar solo el modelo que tú aceptes.
    

GrapesJS documenta APIs de `Panels`, `BlockManager` y `Commands` precisamente para eso. Puedes eliminar botones de paneles, añadir los tuyos, limitar bloques y usar managers personalizados en vez de tragarte la UI completa por defecto.

## Cuándo sí haría fork

Yo solo haría fork si te topas con una de estas situaciones:

- necesitas cambiar comportamiento interno que no está expuesto por API,
    
- quieres eliminar partes profundas del editor que siempre reaparecen,
    
- necesitas parches de seguridad o UX que no puedes aislar en plugin,
    
- o quieres congelar una versión porque el upstream cambia demasiado para tu producto.
    

Pero eso debería ser **último recurso**, porque un fork te mete mantenimiento, merges, conflictos y deuda.

## Lo normal en GrapesJS

La vía habitual es:

1. Inicializar GrapesJS con configuración mínima.
    
2. Mover managers a tus propios contenedores o esconderlos.[](https://stackoverflow.com/questions/68174677/how-to-fully-customize-grapesjs-ui)
    
3. Registrar solo tus bloques.[](https://grapesjs.com/docs/api/block_manager.html)
    
4. Eliminar botones/paneles no permitidos.
    
5. Desactivar subida libre de assets o entradas peligrosas. Por ejemplo, el `assetManager` permite desactivar upload.[](https://stackoverflow.com/questions/71601322/is-there-a-way-to-remove-the-add-image-button-of-assetmanager-of-grapesjs-edit)
    
6. Interceptar exportado/guardado para convertirlo a tu schema seguro.[](https://grapesjs.com/)
    

Eso ya te deja un editor muy capado sin tocar el core.

## Mi recomendación concreta

Para tu caso multitenant, yo haría esto:

- **Fase 1:** sin fork, con configuración + plugin propio + UI wrapper.
    
- **Fase 2:** validación fuerte en servidor del resultado guardado.
    
- **Fase 3:** solo si GrapesJS se resiste en algo nuclear, entonces evaluar fork pequeño y bien aislado.[](https://grapesjs.com/)
    

## Qué haría yo personalmente

Yo no forkeaba de entrada. Haría un **“restricted builder”** sobre GrapesJS: bloques propios, paneles mínimos, asset manager bloqueado, nada de HTML arbitrario, nada de CSS libre, y guardado en JSON controlado.  
Si más adelante ves que el 20% del esfuerzo se te va en pelear con límites del core, entonces sí tendría sentido un fork muy consciente.[](https://grapesjs.com/)

## Regla práctica

- **Si puedes quitarlo con config, plugin o wrapper, no hagas fork.**
    
- **Si necesitas reescribir comportamiento interno persistente, considera fork.**[](https://grapesjs.com/)
    

Mi apuesta, con lo que has contado, es: **no fork al principio**. GrapesJS ya parece lo bastante configurable como para montar tu editor acotado sin meterte en ese jardín.

¿Quieres que te enumere exactamente **qué partes de GrapesJS quitaría** para convertirlo en un editor seguro de plantillas PDF multitenant?

------------------

Sí: para convertir GrapesJS en un editor **seguro y acotado** para plantillas PDF multitenant, yo le quitaría casi todo lo “web builder genérico” y lo dejaría como un **constructor de bloques de documento**. GrapesJS permite recortar paneles, bloques y comandos por API, así que esta estrategia encaja bien sin forkar de entrada.

## Quitar de inicio

Estas son las partes que yo **desactivaría o escondería** en la primera versión:

- **Edición libre de HTML/CSS**: nada de code editor, nada de pegar markup arbitrario, nada de `<style>` ni `<script>`. Eso reduce muchísimo el riesgo de inyección y de layouts imposibles.
    
- **Asset upload libre** dentro del editor: el usuario no debería subir imágenes a donde quiera ni pegar URLs arbitrarias; solo elegir assets ya validados de Cloudinary o de tu biblioteca aprobada. El asset manager de GrapesJS se puede limitar o sustituir.
    
- **Paneles avanzados** como layers, traits complejos, selector manager o style manager completo, al menos para tenants estándar. Puedes quitar botones de paneles y vistas completas con la API de `Panels`.
    
- **Comandos de exportación genérica** HTML/CSS/JS si el resultado final debe pasar siempre por tu backend y tu renderer controlado. GrapesJS expone `Commands`, así que puedes sustituir los tuyos por acciones seguras de guardar/previsualizar.
    

## Dejar solo esto

Yo dejaría una interfaz mínima con:

- Lienzo central de documento.
    
- Biblioteca de **bloques permitidos**: portada, cabecera, párrafo, título, subtítulo, tabla, callout, lista, imagen, pie, salto de página, firma visual si un día la quieres, etc. Los bloques son una pieza natural en GrapesJS y puedes registrar solo los tuyos.
    
- Panel lateral de propiedades muy pequeño: texto, alineación, color desde paleta permitida, márgenes predefinidos, variante visual, logo y selección de asset.
    
- Botones propios: **Guardar**, **Previsualizar PDF**, **Duplicar plantilla**, **Restaurar versión**.[](https://grapesjs.com/docs/modules/Commands.html)
    

## Qué restringiría fuerte

Las restricciones clave serían estas:

- **Fuentes**: allowlist cerrada, por ejemplo 5–10 familias aprobadas.
    
- **Colores**: tokens de marca o paletas validadas, no color picker libre completo para todos.
    
- **Espaciados y tamaños**: escalas predefinidas, no píxeles arbitrarios.
    
- **Imágenes**: solo assets seleccionados desde tu repositorio aprobado.[](https://davidwalsh.name/cloudinary-fetch)
    
- **Tablas y bloques**: plantillas de estructura fija o semilibre, no HTML libre.
    
- **Páginas**: si usas secciones equivalentes a páginas o bloques lógicos, que el usuario no pueda romper cabeceras/pies ni zonas reservadas.[](https://grapesjs.com/docs/api/pages.html)
    

## Qué guardaría

No guardaría el HTML/CSS “tal cual sale” como fuente de verdad. Guardaría un **JSON de documento/plantilla** propio, por tenant, con versión y schema validado, y el HTML lo generaría después tu backend. GrapesJS puede exportar estructuras y JSON, pero tu sistema debería tratar eso como input intermedio, no como output confiable final.[](https://grapesjs.com/)

Ejemplo mental de lo que sí guardaría:

- `templateId`, `tenantId`, `version`
    
- `themeTokens`
    
- `blocks[]` con tipo, orden y props permitidas
    
- `assets[]` con referencias a Cloudinary
    
- `pageSettings`
    
- `headerVariant`, `footerVariant`
    

Eso te mantiene a salvo y te deja evolucionar el renderer más adelante.[](https://davidwalsh.name/cloudinary-fetch)

## Dos niveles de editor

Yo haría dos perfiles:

- **Básico**: casi todo bloqueado salvo contenido, logo, colores y disposición simple.
    
- **Avanzado interno o premium**: más bloques, más variantes, quizá más control tipográfico, pero siempre dentro de schema.
    

Eso encaja con tu idea de que ciertos clientes puedan pedir algo especial sin abrirles la puerta a romper el sistema.

## Qué piezas de GrapesJS tocaría

En concreto, revisaría y recortaría estas zonas:

- **Panels**: dejar solo tus botones esenciales.[](https://grapesjs.com/docs/api/panels.html)
    
- **BlockManager**: registrar únicamente bloques permitidos.[](https://grapesjs.com/docs/api/block_manager.html)
    
- **Commands**: reemplazar export/save por tu flujo propio.[](https://grapesjs.com/docs/modules/Commands.html)
    
- **Pages**: si usas varias páginas o secciones, mapearlas a estructura controlada.[](https://grapesjs.com/docs/api/pages.html)
    
- **AssetManager**: sin subida libre; selector integrado con Cloudinary/tu media library.
    

## Mi configuración de arranque

Si yo lo hiciera, la primera versión sería así:

- Sin editor de código.[](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/72482)
    
- Sin CSS libre.[](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/72482)
    
- Sin HTML custom.[](https://theproductguy.in/blogs/html-sanitization-guide/)
    
- Sin JS.[](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/72482)
    
- Sin subida libre de imágenes.[](https://stackoverflow.com/questions/71601322/is-there-a-way-to-remove-the-add-image-button-of-assetmanager-of-grapesjs-edit)
    
- Solo bloques cerrados y propiedades limitadas.[](https://grapesjs.com/docs/api/block_manager.html)
    
- Guardado en JSON validado en servidor.
    
- Render final a HTML/PDF fuera del editor.[](https://github.com/simonhaenisch/md-to-pdf)
    

Con eso GrapesJS deja de ser “constructor de webs” y pasa a ser más bien un **builder visual de documentos**.

## Mi criterio

Yo lo plantearía así: **usa GrapesJS como shell visual, pero no como fuente de verdad ni como sistema de permisos**. La seguridad y la consistencia deben vivir en tu schema, en tu backend y en tu renderer.

Si quieres, el siguiente paso útil sería que te proponga una **matriz exacta de permisos**, por ejemplo: qué puede tocar un tenant básico, qué puede tocar uno avanzado y qué queda solo para admin interno.

-----------------------
Sí, lo de **N plantillas por tenant** encaja muy bien con el modelo que veníamos hablando: cada tenant puede tener varias plantillas activas según uso, por ejemplo `interno`, `externo`, `puesto`, `actividad`, `informe técnico`, `acta`, `propuesta`, etc., y seleccionar una por tipo documental o workflow. Eso es totalmente razonable en multi-tenant y además se versiona bien si guardas la definición en tu backend en vez de depender de archivos sueltos.

## Sobre PDFs accesibles

Aquí la respuesta corta es: **no, no lo daría por solucionado automáticamente**. Generar PDFs accesibles es bastante más exigente que “hacer un PDF bonito”, porque un PDF accesible necesita al menos estar **tagged** y tener estructura semántica correcta, orden de lectura, encabezados, listas, tablas bien marcadas y textos alternativos en imágenes.

Chromium/Chrome sí ha avanzado en esto: desde Chrome 85 puede generar **tagged PDFs** al imprimir páginas web, y Puppeteer expone una opción `tagged` en `PDFOptions` para generar PDF etiquetado, aunque se marca como experimental. Eso significa que un flujo HTML→PDF bien hecho puede ir bastante mejor en accesibilidad que otros motores más “gráficos”.

## Lo que sí ayuda

Si tu fuente es **HTML semántico bien construido**, tienes una base bastante mejor para accesibilidad. Chrome puede trasladar parte de esa estructura al PDF etiquetado, incluyendo encabezados, listas, tablas, párrafos e incluso descripciones de imágenes cuando el HTML de origen está bien marcado.

Por tanto, si quieres soportar tenants con exigencia a11y, yo haría esto desde el diseño del sistema:

- Plantillas basadas en **HTML semántico**, no en cajas arbitrarias.
    
- Bloques estructurados: título, subtítulo, sección, tabla de datos, figura, nota, lista, etc.[](https://www.washington.edu/accesstech/documents/tagged-pdf/)
    
- Imágenes con `alt` obligatorio cuando sean informativas.
    
- Idioma del documento, título y metadatos bien definidos; algunos equipos complementan esto luego con `pdf-lib` para metadata como título o lenguaje.[](https://stackoverflow.com/questions/64051531/have-a-puppeteer-generated-pdf-pass-accessibility-reports)
    

## Lo que no queda resuelto solo con eso

Aunque saques un **tagged PDF**, eso **no garantiza** cumplimiento real de PDF/UA ni de todas las exigencias de accesibilidad. La propia documentación de accesibilidad para PDF insiste en que los tags son esenciales, pero por sí solos no bastan: hay que revisar estructura, orden de lectura, tablas, encabezados, textos alternativos y otras reglas.[](https://www.washington.edu/accesstech/documents/tagged-pdf/)

Además, en el ecosistema Puppeteer/Chromium ha habido limitaciones históricas y comportamientos incompletos, por ejemplo problemas con traslado de `alt` text o diferencias entre lo que hace Chrome manualmente y lo que expone Puppeteer. Aunque hoy haya soporte experimental para tagged PDFs, yo no asumiría cumplimiento automático sin validación.

## Mi recomendación realista

Para tenants normales, puedes generar PDFs “razonablemente accesibles” si:

- usas HTML semántico,
    
- activas tagged PDF,
    
- limitas las plantillas a bloques correctos,
    
- y exiges campos como idioma, título y alt text.
    

Pero para tenants que te pidan **accesibilidad contractual o normativa fuerte** —por ejemplo PDF/UA, ADA, Section 508 o equivalentes— yo no lo vendería como resuelto sin un paso adicional de **validación y posible remediación**. Hay bastante consenso en que hacer PDF realmente accesible sigue siendo delicado, y a veces requiere revisión adicional o herramientas especializadas.

## Cómo lo plantearía en producto

Yo lo dividiría en dos niveles de servicio:

|Nivel|Qué ofreces|Riesgo|
|---|---|---|
|**A11y base**|HTML semántico, tagged PDF, metadatos, alt text y plantillas restringidas.|Bueno para muchos casos, pero no garantiza conformidad formal. [](https://www.washington.edu/accesstech/documents/tagged-pdf/)|
|**A11y estricta**|Lo anterior + validación contra criterios PDF accesibles y flujo de remediación si hace falta.|Más coste y más complejidad, pero es la vía seria si el cliente lo exige.|

## Qué haría yo contigo

Si tu app va a tener tenants que pidan a11y, yo diseñaría desde ya el editor de plantillas para que sea **estructural y semántico**, no solo visual. Eso te deja mucho mejor posicionado para tagged PDF y para futuras validaciones.

Pero no, **no lo consideraría “solucionado” solo por usar HTML→PDF**. Lo vería como una muy buena base, no como una garantía de cumplimiento completo.

La respuesta práctica sería:

- **sí** a varias plantillas por tenant,
    
- **sí** a un modo “plantilla accesible”,
    
- **no** a prometer PDF accesible normativo sin validación específica.
    

¿Quieres que te proponga cómo debería ser un **schema de plantilla con soporte a11y**, por ejemplo con campos obligatorios como `documentLanguage`, `title`, `altTextPolicy`, `headingMap` y restricciones de bloques?
------------------------------
Sí. Para tu caso haría un **schema de plantilla multitenant con “modo accesible”** que obligue a capturar estructura, metadatos y reglas de contenido desde el editor, en vez de confiar en que luego el PDF salga bien por casualidad. Los PDFs accesibles necesitan, como base, **tagged structure**, orden de lectura lógico, metadatos como título e idioma, jerarquía correcta de headings, alt text en imágenes y tablas bien estructuradas.

## Modelo general

Yo separaría el modelo en 5 bloques:

- identidad de plantilla,
    
- branding,
    
- layout,
    
- reglas de accesibilidad,
    
- estructura de bloques.
    

Además, cada tenant podría tener muchas plantillas, por ejemplo por área, puesto o tipo de salida, y cada plantilla tendría una bandera de accesibilidad con restricciones más duras cuando haga falta.[](https://www.pdf-tools.com/pdf-ua-standard-explained/)

## Schema propuesto

ts

`type PdfTemplate = {   _id: string  tenantId: string  slug: string  name: string  description?: string  category: 'internal' | 'external' | 'legal' | 'report' | 'manual' | 'letter' | 'other'  audience?: 'internal' | 'client' | 'public' | 'mixed'  active: boolean  version: number  parentTemplateId?: string  createdAt: string  updatedAt: string  createdBy: string   branding: {    logoAssetId?: string    logoUrl?: string    primaryColor: string    secondaryColor?: string    accentColor?: string    textColor?: string    headingFont: string    bodyFont: string    monoFont?: string  }   documentDefaults: {    title?: string    author?: string    subject?: string    keywords?: string[]    language: string    pageSize: 'A4' | 'Letter'    margins: {      top: string      right: string      bottom: string      left: string    }    showCover: boolean    showToc: boolean    showHeader: boolean    showFooter: boolean    pageNumbering: 'none' | 'x-of-y' | 'current-only'  }   accessibility: {    mode: 'off' | 'best-effort' | 'strict'    taggedPdfRequired: boolean    documentLanguageRequired: boolean    documentTitleRequired: boolean    logicalHeadingOrderRequired: boolean    altTextPolicy: 'none' | 'required-for-informative-images' | 'required-all-images'    decorativeImagesAllowed: boolean    bookmarksRequiredOverPages?: number    tableHeaderRequired: boolean    forbidTextAsImage: boolean    requireSemanticLists: boolean    requireReadingOrderValidation: boolean    minimumContrastRatio?: number  }   layoutRules: {    allowMultiColumn: boolean    maxColumns: 1 | 2    avoidAbsolutePositioning: boolean    keepHeadingsWithNextBlock: boolean    avoidPageBreakInsideTables: boolean    avoidPageBreakInsideCallouts: boolean    widowControl: boolean    orphanControl: boolean  }   allowedBlocks: TemplateBlockDefinition[]  blockTree: TemplateBlockInstance[] }`

Este enfoque te obliga a definir de forma explícita cosas que en PDF accesible son importantes, como título, idioma, headings, alt text y orden lógico. Los requisitos de accesibilidad más repetidos en guías y estándares incluyen precisamente título/metadata, idioma, estructura etiquetada, headings correctos, imágenes con texto alternativo y orden de lectura coherente.

## Bloques permitidos

Yo haría que el editor no componga HTML libre, sino **bloques semánticos**. Eso ayuda mucho a la futura exportación a tagged PDF, porque sabes de antemano qué representa cada trozo. Los PDF accesibles dependen de que headings, listas, figuras y tablas estén correctamente identificados y ordenados.

Ejemplo:

ts

`type TemplateBlockDefinition = {   type:    | 'document-title'    | 'section-heading'    | 'paragraph'    | 'list'    | 'image'    | 'table'    | 'callout'    | 'quote'    | 'page-break'    | 'toc'    | 'header'    | 'footer'  enabled: boolean  repeatable: boolean  propsSchema: Record<string, unknown> }`

ts

`type TemplateBlockInstance = {   id: string  type: string  props: Record<string, unknown>  children?: TemplateBlockInstance[] }`

## Reglas específicas de a11y

Estas son las reglas que yo pondría como obligatorias en `mode: "strict"`:

- **`documentLanguage` obligatorio** porque el idioma debe declararse para que los lectores de pantalla pronuncien correctamente el contenido.
    
- **`title` obligatorio** y distinto del nombre de archivo; además debe mostrarse como título del documento.
    
- **Un único H1** y niveles de heading sin saltos ilógicos, por ejemplo H1 → H2 → H3. Las guías de accesibilidad insisten en no saltar niveles y mantener jerarquía lógica.
    
- **Alt text obligatorio** en imágenes informativas, con posibilidad de marcar imágenes decorativas.
    
- **Tablas con encabezados reales** y estructura simple; los PDFs accesibles requieren identificar `TH/TD` y relaciones de cabecera.
    
- **Orden de lectura lógico** verificable. El orden de tags debe reflejar el orden en que se lee visualmente.
    
- **Texto como texto**, no como imagen, salvo elementos decorativos. PDF/UA y guías prácticas desaconsejan usar imágenes para texto significativo.
    
- **Bookmarks** a partir de cierto tamaño, por ejemplo documentos de 10 páginas o más.[](https://equidox.co/blog/the-why-and-how-of-pdf-accessibility-metadata/)
    

## Campos obligatorios por documento

Además del schema de plantilla, yo obligaría a que cada documento generado aporte estos campos cuando la plantilla sea accesible:

ts

`type AccessibleDocumentInput = {   documentTitle: string  documentLanguage: string  author?: string  subject?: string  keywords?: string[]  blocks: DocumentBlockInput[] }`

Y en cada bloque sensible:

ts

`type ImageBlockInput = {   assetId: string  altText?: string  decorative?: boolean  caption?: string }`

ts

`type HeadingBlockInput = {   level: 1 | 2 | 3 | 4 | 5 | 6  text: string }`

ts

`type TableBlockInput = {   caption?: string  headerRows: number  rows: string[][]  summary?: string }`

Eso no garantiza PDF/UA por sí solo, pero te deja una base mucho más sólida para generar PDFs etiquetados y luego validar lo que salga.

## Validaciones de backend

Yo impondría validaciones de servidor antes de renderizar:

- Hay `documentTitle` y `documentLanguage`.
    
- Solo existe un H1.
    
- No se salta de H1 a H3 sin H2 intermedio.
    
- Toda imagen informativa tiene `altText`.
    
- Ninguna tabla compleja entra en plantilla estricta si no puede mapearse bien a headers.
    
- Si el documento supera `bookmarksRequiredOverPages`, se exige TOC o bookmarks.[](https://equidox.co/blog/the-why-and-how-of-pdf-accessibility-metadata/)
    
- No se permiten bloques visuales que dependan solo del color para transmitir significado, porque PDF/UA y buenas prácticas lo desaconsejan.
    

## Niveles de plantilla

Yo tendría tres niveles:

|Modo|Uso|Regla|
|---|---|---|
|`off`|Plantillas normales|Sin exigencias específicas.|
|`best-effort`|PDF razonablemente accesible|HTML semántico, tagged PDF, metadatos y reglas básicas.|
|`strict`|Clientes con exigencia contractual|Reglas obligatorias, validación fuerte, revisión post-render y posible remediación.|

## Qué resuelve y qué no

Este schema **sí resuelve la parte de diseño del sistema**: te fuerza a capturar la información que hace falta para intentar generar un PDF accesible desde plantillas.  
Pero no sustituye una validación posterior del PDF final, porque la accesibilidad real depende también de cómo el motor HTML→PDF traduzca esa semántica a tagged PDF. Puppeteer/Chromium ya soporta tagged PDFs, pero el soporte sigue teniendo matices y no conviene prometer conformidad formal sin verificación.

## Mi recomendación práctica

Yo lo implementaría así:

- Plantilla con `accessibility.mode`.
    
- Editor que cambia de comportamiento si el modo es `strict`.
    
- Backend que rechaza documentos que incumplen reglas.
    
- Render HTML semántico → PDF etiquetado.
    
- Validación post-render para tenants exigentes.
    

Si quieres, el siguiente paso útil es que te dé este mismo schema ya **aterrizado a MongoDB/Mongoose o Zod/TypeScript**, listo para meterlo en tu app.

---------------------

qué librerías recomiendas para generar PDFs con etiquetas de accesibilidad
--------------------------
Si te centras en **JavaScript/TypeScript**, mis recomendaciones reales quedarían así: **Puppeteer/Chromium** para HTML semántico a PDF etiquetado, y **PDFKit** si quieres construir el PDF de forma más programática con soporte explícito de accesibilidad. Ambos son los candidatos más razonables en ecosistema JS para trabajar con **tagged PDF** o estructura accesible.

## Recomendación por caso

|Caso|Librería|Por qué|
|---|---|---|
|Plantillas HTML/CSS, branding, multitenant, Markdown→PDF|**Puppeteer**|Puppeteer expone la opción `tagged` en `PDFOptions` para generar PDF etiquetado, y Chromium lleva años mejorando la generación de tagged PDFs desde HTML semántico.|
|Generación programática más controlada en Node|**PDFKit**|PDFKit declara soporte de accesibilidad, incluyendo marked content, logical structure, Tagged PDF y PDF/UA.|
|Postproceso de metadata|**pdf-lib**|No es el motor principal para tagged PDF, pero sirve para ajustar título, idioma y otros metadatos tras generar el PDF. [](https://stackoverflow.com/questions/64051531/have-a-puppeteer-generated-pdf-pass-accessibility-reports)|

## Mi orden de preferencia

Para tu arquitectura, donde ya estás pensando en plantillas, branding, tenants y quizá Markdown→PDF, yo pondría **Puppeteer como primera opción**. Su ventaja es que parte de HTML, y eso encaja mejor con semántica, headings, listas, tablas y alt text, que son la base de los PDFs accesibles. Además, Puppeteer tiene opción nativa `tagged` para generar PDF accesible, aunque la propia API la marca como experimental.

La segunda opción sería **PDFKit** si quieres construir documentos muy controlados desde código y no dependes tanto de HTML/CSS. PDFKit documenta soporte para Tagged PDF, estructura lógica y PDF/UA, lo cual en JS es bastante valioso.

## Qué no esperaría de otras librerías JS

No contaría con `pdf-lib` como solución completa de accesibilidad etiquetada. Es útil para manipulación y para completar metadatos, pero no aparece como motor fuerte de tagged PDF comparable a Puppeteer o PDFKit. En ejemplos prácticos se usa justo para complementar un PDF generado por otro motor, por ejemplo para fijar título o idioma.[](https://stackoverflow.com/questions/64051531/have-a-puppeteer-generated-pdf-pass-accessibility-reports)

Tampoco asumiría que librerías de visualización tipo React-PDF o PDF.js te resuelvan esto por sí solas. Incluso en discusiones del ecosistema React-PDF se recuerda que, si el documento no está etiquetado, no hay una capa semántica accesible que “recuperar” mágicamente.[](https://github.com/wojtekmaj/react-pdf/issues/1494)

## Si sales de JavaScript

Si un día necesitas **máxima seriedad en PDF accesible** y puedes salirte del stack JS, los nombres que más suelen aparecer son motores como **iText** y otras librerías del ecosistema Java, donde históricamente ha habido más soporte fuerte para tagged PDF/PDF/UA. Incluso comparativas y respuestas técnicas remarcan que hay muy pocas opciones libres/populares que hagan esto bien, y suelen citar iText o alternativas Java como referencia.[](https://stackoverflow.com/questions/48777316/generate-a-pdf-from-html-with-tags-for-accessibility)

## Mi recomendación práctica para ti

Yo haría esta combinación:

- **Puppeteer** como motor principal de generación, porque se adapta mejor a tu idea de plantillas multitenant y documentos con branding.
    
- **HTML semántico restringido** como fuente.
    
- **pdf-lib** para completar o corregir metadatos como `title` y `language` si el flujo lo necesita.[](https://stackoverflow.com/questions/64051531/have-a-puppeteer-generated-pdf-pass-accessibility-reports)
    
- **Validación posterior** con herramientas de accesibilidad, porque tagged PDF no garantiza por sí solo conformidad real. La Universidad de Washington recomienda revisar si el PDF está etiquetado y usar herramientas como Acrobat Pro o PAC para comprobar accesibilidad.[](https://www.washington.edu/accesstech/documents/check-pdfs/)
    

## Mi ranking corto

1. **Puppeteer** — mejor encaje para tu sistema de plantillas HTML/CSS y multitenant.
    
2. **PDFKit** — mejor si prefieres construir el PDF con más control programático en Node.
    
3. **pdf-lib** — complemento para metadata/postproceso, no motor principal de a11y.[](https://stackoverflow.com/questions/64051531/have-a-puppeteer-generated-pdf-pass-accessibility-reports)
    

Si quieres, te puedo hacer ahora una **comparativa técnica Puppeteer vs PDFKit** pensando específicamente en tu caso: multitenant, plantillas, branding, Markdown→PDF y opción de PDFs accesibles.

-------------------------
Entonces lo mejor sería hacer como dos partes:
1. Una con pdflib para las cosas normales y un editor normal, o
2 utilizar un editor avanzado y PDF Kit.
-------------------------
Casi, pero yo lo reformularía así: **no haría dos soluciones separadas**, sino una arquitectura en capas. Para operaciones PDF normales usaría **pdf-lib**, y para generación de documentos “de plantilla” usaría un motor distinto; si necesitas accesibilidad seria, ese motor debería ser **PDFKit** o, en ciertos casos, **HTML semántico + Puppeteer**, no un “editor avanzado” por sí mismo.

## Cómo lo dividiría

Yo lo separaría en **tres** piezas, no en dos:

1. **Manipulación PDF**: `pdf-lib` para merge, split, extraer páginas, reordenar, insertar o quitar páginas. pdf-lib está muy bien para ese trabajo.
    
2. **Editor de plantillas**: una UI tuya o basada en GrapesJS, para definir bloques, branding y layout. El editor no genera el PDF final por sí solo; genera una definición estructurada.
    
3. **Motor de render PDF**: aquí eliges según necesidad. Si quieres accesibilidad etiquetada más seria, **PDFKit** es fuerte porque declara soporte para marked content, logical structure, Tagged PDF y PDF/UA.
    

## Dónde pondría cada librería

|Función|Librería|Motivo|
|---|---|---|
|Separar, juntar, seleccionar páginas|**pdf-lib**|Muy buena para modificación estructural de PDFs existentes.|
|Plantillas visuales multitenant|**Editor propio / GrapesJS capado**|Controlas bloques y seguridad; no dependes de HTML libre.|
|PDF accesible desde estructura propia|**PDFKit**|Tiene soporte explícito de accesibilidad y Tagged PDF/PDF/UA.|
|PDFs corporativos desde HTML/CSS|**Puppeteer**|Puede generar tagged PDFs desde HTML semántico, aunque el soporte tiene matices y ha tenido limitaciones.|

## Lo que no haría

No haría esto:

- “Editor normal + pdf-lib” como solución completa de documentos, porque **pdf-lib no es el mejor motor para generar PDFs accesibles complejos**. Sirve más para manipular o complementar.
    
- “Editor avanzado + PDFKit” como una sola pieza mental, porque el editor y el renderer son problemas distintos. El editor define la plantilla; PDFKit renderiza el documento.
    

## Mi recomendación real

La arquitectura buena para ti sería:

- **pdf-lib** para utilidades PDF.[](https://pdf-lib.js.org/)
    
- **Schema de plantilla + editor restringido** para que cada tenant tenga N plantillas.[](https://grapesjs.com/docs/api/block_manager.html)
    
- **PDFKit** para plantillas que exigen accesibilidad fuerte.
    
- **Puppeteer** solo para plantillas donde prime maquetación HTML/CSS y no haya una exigencia dura de a11y certificable. Puppeteer tiene `tagged`, pero incluso en el ecosistema hay reportes de limitaciones con alt text y cumplimiento fino.
    

## Decisión práctica

Si lo quieres resumir mucho, yo diría:

- **Sí a pdf-lib** para “cosas normales de PDF”.[](https://pdf-lib.js.org/)
    
- **Sí a un editor visual** para plantillas.
    
- **Sí a PDFKit** cuando la salida tenga que ser realmente seria en accesibilidad.
    
- **No** mezclar “editor” y “motor PDF” como si fueran la misma capa.
    

## Mi propuesta final

Yo montaría dos pipelines de salida sobre el mismo editor de plantillas:

- **Pipeline estándar**: plantilla → HTML/PDF bonito o utilidades de pdf-lib.
    
- **Pipeline accesible**: plantilla semántica → PDFKit → validación a11y.
    

Eso te evita rehacer producto dos veces y te deja crecer bien por tenant y por nivel de exigencia.

¿Quieres que te dibuje la arquitectura concreta de carpetas/módulos para ese enfoque, por ejemplo `template-editor`, `pdf-ops`, `render-standard`, `render-accessible` y `template-schema`?

 Yo lo montaría como un **monolito Next.js App Router por features**, dejando `app/` para rutas y pantallas, y moviendo la lógica PDF a módulos separados. Ese patrón encaja bien con recomendaciones habituales de Next.js: App Router para routing y una capa feature/domain para negocio reutilizable.

## Estructura general

La idea es separar claramente:

- **editor de plantillas**,
    
- **operaciones PDF**,
    
- **render estándar**,
    
- **render accesible**,
    
- **schema/validación**,
    
- y **assets multitenant**.
    

`pdf-lib` quedaría para manipular PDFs existentes, mientras que `PDFKit` sería el renderer para documentos accesibles o muy controlados. `pdf-lib` está orientado a crear/modificar PDFs, y PDFKit a generación documental rica; además PDFKit documenta funciones de accesibilidad.

text

`src/ ├─ app/ │  ├─ (dashboard)/ │  │  ├─ tenants/ │  │  │  └─ [tenantId]/ │  │  │     ├─ templates/ │  │  │     │  ├─ page.tsx │  │  │     │  ├─ new/page.tsx │  │  │     │  └─ [templateId]/page.tsx │  │  │     ├─ pdf-tools/ │  │  │     │  ├─ split/page.tsx │  │  │     │  ├─ merge/page.tsx │  │  │     │  └─ extract/page.tsx │  │  │     └─ documents/ │  │  │        ├─ page.tsx │  │  │        └─ [documentId]/page.tsx │  │  └─ api/ │  │     ├─ templates/ │  │     ├─ documents/ │  │     ├─ pdf-ops/ │  │     └─ render/ │  └─ layout.tsx │ ├─ features/ │  ├─ template-editor/ │  ├─ pdf-ops/ │  ├─ render-standard/ │  ├─ render-accessible/ │  ├─ template-schema/ │  ├─ tenants/ │  └─ assets/ │ ├─ lib/ │  ├─ mongodb/ │  ├─ auth/ │  ├─ storage/ │  └─ utils/ │ ├─ components/ │  ├─ ui/ │  └─ pdf/ │ ├─ types/ └─ config/`

## Carpetas clave

## `app/`

Aquí solo pondría rutas, layouts, server actions y endpoints. Next.js recomienda usar `app/` para convenciones de routing y pantalla, no para meter toda la lógica de dominio.

## `features/template-editor/`

Aquí iría todo lo visual y de negocio del constructor de plantillas:

text

`features/template-editor/ ├─ components/ │  ├─ TemplateCanvas.tsx │  ├─ BlockPalette.tsx │  ├─ PropertiesPanel.tsx │  ├─ AccessibilityPanel.tsx │  └─ TemplatePreview.tsx ├─ hooks/ │  ├─ useTemplateEditor.ts │  └─ useBlockSelection.ts ├─ services/ │  ├─ template-editor.service.ts │  └─ template-preview.service.ts ├─ adapters/ │  └─ grapesjs.adapter.ts ├─ mappers/ │  └─ editor-to-template-schema.ts └─ index.ts`

Si usas GrapesJS, lo encapsularía en `grapesjs.adapter.ts` para que el resto del sistema no dependa directamente del editor. Así mañana puedes sustituirlo sin reventar media app.

## `features/template-schema/`

Este módulo sería el corazón del sistema, porque define **la verdad del documento**, no el HTML ni el estado interno de GrapesJS.

text

`features/template-schema/ ├─ schemas/ │  ├─ template.schema.ts │  ├─ branding.schema.ts │  ├─ accessibility.schema.ts │  └─ block.schema.ts ├─ validators/ │  ├─ validate-template.ts │  ├─ validate-heading-order.ts │  ├─ validate-image-alt.ts │  └─ validate-table-structure.ts ├─ defaults/ │  ├─ default-template.ts │  └─ default-accessible-template.ts ├─ types/ │  └─ template.types.ts └─ index.ts`

Aquí metería Zod o el sistema de validación que uses, para que ninguna plantilla llegue al renderer si viola las reglas de negocio o de accesibilidad.

## `features/pdf-ops/`

Todo lo de `pdf-lib` iría aquí.

text

`features/pdf-ops/ ├─ services/ │  ├─ merge-pdfs.ts │  ├─ split-pdf.ts │  ├─ extract-pages.ts │  ├─ reorder-pages.ts │  ├─ remove-pages.ts │  └─ normalize-pdf-metadata.ts ├─ parsers/ │  └─ page-range.parser.ts ├─ validators/ │  └─ validate-page-selection.ts └─ index.ts`

`pdf-lib` soporta merge, split, add/insert/remove pages y copy pages, así que este módulo debería quedar muy limpio y autónomo.

## `features/render-standard/`

Este renderer sería para documentos no críticos en accesibilidad: branding, informes internos, propuestas, etc.

text

`features/render-standard/ ├─ services/ │  ├─ render-html-template.ts │  ├─ render-markdown-to-html.ts │  ├─ render-html-to-pdf.ts │  └─ build-print-styles.ts ├─ templates/ │  ├─ corporate/ │  ├─ technical/ │  └─ letter/ ├─ mappers/ │  └─ template-to-html-viewmodel.ts └─ index.ts`

Si en esta capa usas HTML/CSS y Puppeteer, tiene sentido porque Chromium puede generar tagged PDFs desde HTML semántico, aunque yo seguiría reservando esta capa para casos donde la exigencia a11y no sea contractual al máximo nivel.

## `features/render-accessible/`

Aquí iría el renderer serio con PDFKit.

text

`features/render-accessible/ ├─ services/ │  ├─ render-accessible-pdf.ts │  ├─ create-pdfkit-document.ts │  ├─ register-fonts.ts │  ├─ write-metadata.ts │  ├─ write-bookmarks.ts │  └─ finalize-pdf.ts ├─ writers/ │  ├─ write-heading.ts │  ├─ write-paragraph.ts │  ├─ write-list.ts │  ├─ write-image.ts │  ├─ write-table.ts │  ├─ write-callout.ts │  └─ write-footer.ts ├─ accessibility/ │  ├─ tag-structure.ts │  ├─ reading-order.ts │  └─ alt-text.ts ├─ mappers/ │  └─ template-to-pdfkit-model.ts └─ index.ts`

PDFKit documenta soporte para marked content, logical structure y Tagged PDF/PDF/UA, así que esta capa debe trabajar a partir de un modelo semántico fuerte y no de HTML libre.

## Multitenant y assets

Yo crearía un módulo específico para branding y assets:

text

`features/assets/ ├─ services/ │  ├─ resolve-tenant-assets.ts │  ├─ get-logo-url.ts │  ├─ get-font-manifest.ts │  └─ validate-asset-origin.ts └─ index.ts features/tenants/ ├─ services/ │  ├─ get-tenant-branding.ts │  ├─ get-tenant-template-set.ts │  ├─ resolve-tenant-permissions.ts │  └─ get-default-template-by-context.ts ├─ repositories/ │  ├─ tenant.repository.ts │  └─ template.repository.ts └─ index.ts`

Como tu app es multitenant y ya te preocupa centralizar la lógica, dejaría en este módulo la resolución de qué plantilla usar según actividad, puesto, uso interno/externo o nivel de accesibilidad.

## Módulos transversales

En `lib/` dejaría solo infraestructura:

text

`lib/ ├─ mongodb/ │  ├─ client.ts │  └─ collections.ts ├─ storage/ │  ├─ cloudinary.ts │  └─ signed-urls.ts ├─ auth/ │  ├─ session.ts │  └─ permissions.ts └─ utils/    ├─ ids.ts   ├─ dates.ts   └─ files.ts`

Esto encaja con una estructura App Router donde la lógica reusable y de negocio vive fuera de `app/`.

## Flujo entre módulos

Yo lo visualizaría así:

text

`[Template Editor UI]         │        ▼ [template-editor adapter]         │        ▼ [template-schema validation]         │        ├──► save template (Mongo)        │        ├──► render-standard        │       └── HTML/CSS/PDF        │        └──► render-accessible                └── PDFKit tagged PDF [Uploaded PDF]         │        ▼ [pdf-ops / pdf-lib]         │        ├──► split / merge / extract / reorder        └──► pass result to RAG ingest or document storage`

## Convenciones internas

Yo impondría estas reglas:

- `app/` solo rutas y composición de pantallas.[](https://nextjs.org/docs/app/getting-started/project-structure)
    
- Cada feature expone un `index.ts`.
    
- Ninguna ruta toca directamente Cloudinary, Mongo o PDFKit; siempre pasa por `services`.
    
- El editor nunca guarda HTML como fuente de verdad; guarda schema JSON validado.
    
- `pdf-lib` nunca renderiza plantillas.
    
- `render-accessible` nunca consume HTML libre; consume un modelo semántico ya validado.
    

## Mi propuesta concreta

Si fuera tu repo, yo lo dejaría así:

text

`src/ ├─ app/ ├─ features/ │  ├─ template-editor/ │  ├─ template-schema/ │  ├─ pdf-ops/ │  ├─ render-standard/ │  ├─ render-accessible/ │  ├─ tenants/ │  └─ assets/ ├─ lib/ ├─ components/ ├─ types/ └─ config/`

Y dentro de `features/` pensaría el sistema en tres frases:

- **`template-schema` manda**,
    
- **`pdf-ops` manipula PDFs existentes**,
    
- **`render-*` genera PDFs nuevos**.
    

Eso te deja un sistema limpio, extensible y compatible con tus necesidades de Next.js, MongoDB, Vercel y multi-tenant.

¿Quieres que el siguiente paso sea convertir esta arquitectura en un **árbol real con nombres de archivos TypeScript concretos**, incluyendo interfaces principales y qué exporta cada módulo?

----------------------

te pongo más contexto. Lo que estoy creando es una suite de aplicaciones. Son aplicaciones separadas (no es monorepo), hay una aplicación para el AUTH, otra para recibir los LOGS/trazabilidad, otra para la gestión de permisos de los tenants, otra para hacer exámenes de entrenamiento, otra para mostrar analíticas (salen de los logs). También hay partes comunes como estilos o widgets y hay una landing que va dando acceso a una y otras. Todas están afectas a  los permisos de los tenants, de departamentos de los tenant, incluso a usuarios y grupos de usuarios. Se conectan por servicios entre ellas. Cada una vive en un subdominio auth.abdia.es  analytics.abdia.es     
Esta aplicación de gestión de PDF yo la veo como una aplicación nueva con varias subfunciones (extraer texto, manipular páginas/textos, edición PDF), cada subfunción, también estará afecta a los distintos permisos. 
Mi duda es si no es mejor hacer tres aplicaciones diferentes con menos funciones cada una o hacer dos (extraer y manipular; edición/plantillas) o cuatro (extraer, manipular, generar, editar plantillas).  
También tendré que hacer una aplicación para hacer plantillas de emails (para emails que se envíen automáticamente), así que no sé si conviene aprovechar la utilidad de plantillas para los pdf para el email o es mejor llevarlo por separado, pero no tiene porque tener acceso las mismas personas a la creación de plantillas de email que de los pdf, es más, probablemente, habrá que hacer que unas personas del mismo tenant, no puedan acceder a la edición de plantillas de otro grupo.
no sé si esto te ayuda

-------------------------

Sí, ayuda **muchísimo**. Con ese contexto, yo **no** modelaría esto como “una app PDF” única con todo dentro, ni tampoco como cuatro productos completamente separados desde el día 1. Haría una solución **intermedia**: **2 aplicaciones separadas** con límites claros, y dentro de cada una una arquitectura modular fuerte. Eso encaja mejor con cómo ya estás montando la suite: apps independientes por capacidad, conectadas por servicios, con subdominios propios y permisos centralizados por tenant/departamento/grupo/usuario.[](https://www.thoughtworks.com/insights/blog/microservices/modular-monolith-better-way-build-software)

## Mi propuesta

Yo la dividiría así:

|App|Subdominio sugerido|Qué hace|
|---|---|---|
|**docs.abdia.es**|gestión documental/PDF|Extraer texto, OCR, manipular páginas, preparar ingesta para RAG, utilidades PDF.|
|**templates.abdia.es**|plantillas y generación|Plantillas PDF, plantillas email, branding, render documental, control por grupo/departamento.|

Esta separación sigue una lógica de **bounded contexts**: una app opera sobre **documentos existentes** y otra sobre **plantillas/generación**. Thoughtworks insiste en que, cuando separas por capacidades de negocio claras, luego resulta mucho más fácil extraer o evolucionar módulos sin caer en sobrecoste prematuro de microservicios.[](https://www.thoughtworks.com/insights/blog/microservices/modular-monolith-better-way-build-software)

## Por qué no haría 4 apps

No haría cuatro apps separadas —extraer, manipular, generar y editar plantillas— porque te meterías demasiado pronto en fricción de UX, navegación, permisos, despliegues y contratos entre servicios. Las propias guías sobre modular monolith vs microservices suelen advertir que demasiada fragmentación temprana aumenta complejidad operativa antes de aportar valor real.

En tu caso, además, extracción y manipulación están muy cerca del mismo flujo mental de usuario: “tengo un PDF y quiero prepararlo”. Separarlos en productos distintos me parece artificial.[](https://www.thoughtworks.com/insights/blog/microservices/modular-monolith-better-way-build-software)

## Por qué no haría 1 sola app

Tampoco haría una sola app “pdf-suite” con todo, porque **plantillas** es ya otro dominio. Tú mismo has dicho que habrá personas del mismo tenant que podrán editar plantillas de email pero no de PDF, o de un grupo sí y de otro no. Eso indica que el núcleo del problema no es “PDF”, sino **gobierno de plantillas y canales de salida**.

Además, tu suite ya tiene patrón de aplicaciones especializadas por capacidad —auth, logs, analíticas, exámenes, permisos— así que seguir ese patrón aquí te va a dar más coherencia global.

## Cómo repartiría responsabilidades

## 1) `docs.abdia.es`

Esta app sería operativa, centrada en documentos reales:

- extraer texto, OCR, limpieza para RAG,
    
- seleccionar páginas, separar, juntar, recortar,
    
- decidir rangos o excluir trozos antes de ingestión,
    
- almacenar artefactos procesados y trazabilidad.
    

Aquí usarías cosas como `pdf-lib`, `Scribe.js` y el pipeline de limpieza. `pdf-lib` encaja muy bien para merge/split/extract/reorder, y Scribe.js para OCR/extracción.

## 2) `templates.abdia.es`

Esta app sería de gobierno y diseño:

- plantillas PDF,
    
- plantillas email,
    
- branding por tenant/departamento/grupo,
    
- variantes por actividad/puesto/interno-externo,
    
- permisos finos de quién puede editar qué plantilla.
    

Aquí metería el editor visual, el schema de plantillas, el renderer PDF y el renderer email. Dado que ya intuyes que no todos deben ver o editar las mismas plantillas, esta app necesita un modelo ACL fino desde el principio.

## PDF y email: juntos o separados

Yo **sí** los pondría en la misma app de plantillas, pero **no** como el mismo tipo de plantilla. Los pondría bajo un dominio común: **Template Management**. Esto encaja con la idea SaaS de que no todos los componentes compartidos tienen por qué tener la misma tenancy interna; una misma plataforma puede mezclar servicios compartidos con modelos de aislamiento distintos según capacidad.

La clave sería esta jerarquía:

- **App única de plantillas**
    
    - Plantillas PDF
        
    - Plantillas Email
        
    - Brand kits
        
    - Assets aprobados
        
    - Reglas/ACL
        
    - Renderers distintos por canal
        

Eso te permite compartir:

- editor base,
    
- tokens de branding,
    
- gestión de assets,
    
- control de versiones,
    
- permisos,
    
- auditoría.
    

Pero mantener separados:

- schema PDF,
    
- schema Email,
    
- motor PDF,
    
- motor email.
    

## Estructura de permisos

Yo no haría permisos solo a nivel tenant. Haría permisos por **scope de plantilla**, porque tú ya estás hablando de restricciones por departamento, grupo e incluso usuario. Eso suena a una ACL compuesta, no a un simple RBAC plano.

Un modelo razonable sería:

- `tenantId`
    
- `channel`: `pdf | email`
    
- `scopeType`: `tenant | department | group | user`
    
- `scopeId`
    
- `role`: `viewer | editor | approver | publisher | admin`
    
- `templateCollectionId`
    
- `templateId`
    

Así, dentro del mismo tenant puedes permitir que un grupo edite las plantillas de emails automáticos del área comercial, pero no las plantillas PDF internas del área técnica. Eso encaja muy bien con tu necesidad real.

## Lo que haría yo exactamente

Mi decisión sería esta:

## Mantener apps separadas:

- `auth.abdia.es`
    
- `logs.abdia.es`
    
- `analytics.abdia.es`
    
- `permissions.abdia.es`
    
- `docs.abdia.es`
    
- `templates.abdia.es`
    

## Y dentro:

- `docs` con módulos `extract`, `ocr`, `pdf-ops`, `rag-prep`
    
- `templates` con módulos `pdf-templates`, `email-templates`, `brand-kits`, `assets`, `publishing`
    

Esto sigue el patrón de **aplicaciones separadas por capacidad de negocio**, pero evitando pasarte de granularidad.[](https://www.thoughtworks.com/insights/blog/microservices/modular-monolith-better-way-build-software)

## Mi recomendación final

Si tengo que darte una recomendación concreta y no ambigua:

- **No 4 apps.**
    
- **No 1 sola.**
    
- **Sí 2 apps nuevas**: una de documentos y otra de plantillas.[](https://www.thoughtworks.com/insights/blog/microservices/modular-monolith-better-way-build-software)
    
- **Sí** a compartir la utilidad de plantillas entre PDF y email, pero con schemas y permisos diferenciados.[](https://learn.microsoft.com/en-us/azure/architecture/guide/saas-multitenant-solution-architecture/)
    

La razón principal es esta:

- **document processing** y **template management** son dominios distintos,
    
- pero **PDF templates** y **email templates** sí comparten una base fuerte de gobierno, branding, versionado y permisos.[](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/re-defining-multi-tenancy.html)
    

La frase resumen sería: **separa por dominio, no por cada función técnica**.

## Cómo lo llamaría

Yo lo dejaría así:

- **`docs.abdia.es`** → “Document Processing Suite”
    
- **`templates.abdia.es`** → “Template Studio”
    

Y dentro de `Template Studio`:

- PDF Templates
    
- Email Templates
    
- Brand Assets
    
- Access Control
    
- Publish History
    

Eso te da una suite más coherente y mucho más gobernable a medio plazo.

¿Quieres que te dibuje ahora la **arquitectura concreta de esas 2 aplicaciones**, con carpetas, módulos, servicios compartidos y cómo se hablarían con `auth`, `permissions` y `logs`?


-----------------

te doy un detalle más, tengo previsto crear una nueva aplicación más que haga las veces de gestor documental. La idea es utilizar cloudinary, pero, en algunos tenants poder conectar con sus repositorios (habría que crear los conectores). Entonces, los PDF que se suban para extraer texto, editar sus páginas o pdfs finales generados con los templates, deberían ir allí.
por otro lado, todo lo que ocurra en las dos aplicaciones tienen que tener una trazabilidad de grado bancario usando ABDLogs para poder luego usar ABDAnalytics.
¿cómo encuadramos esto con lo que estamos proponiendo?

----------------

Sí: con ese detalle, yo lo **reencuadraría en tres capas**, no en dos. La nueva aplicación de **gestor documental** sería la capa de **almacenamiento y vida del binario**, mientras que `docs.abdia.es` y `templates.abdia.es` serían las capas de **procesamiento/gobernanza** que operan sobre ese almacén y generan trazabilidad a ABDLogs para alimentar ABDAnalytics.

## Encaje arquitectónico

La propuesta quedaría así:

- **Document Manager**: sube, guarda, versiona y resuelve conectores de almacenamiento por tenant; aquí entra Cloudinary como backend por defecto y conectores a repositorios del cliente cuando aplique.
    
- **docs.abdia.es**: extrae texto, hace OCR opcional, limpia, parte/une/reordena páginas y produce derivados operativos.
    
- **templates.abdia.es**: gobierna plantillas, renderiza PDFs finales y publica versiones.
    

Ese reparto encaja muy bien con la suite porque separa **storage**, **processing** y **governance**, evitando mezclar la persistencia del binario con la lógica de extracción/render y con la política de plantillas.

## Qué cambia realmente

El PDF fuente y el PDF final ya no “viven” en `docs` o `templates` como responsabilidad primaria, sino en el **gestor documental**. `docs` y `templates` pasan a **consumir y producir referencias** a assets, no a ser el repositorio principal.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/bffb3ea3-a30b-4e6b-b896-3bdd4a251615/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYE4BJRMJPK&Signature=K15qM6FrM4d7JxQgT9gIBIs5P50%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCIIhM0P545RuUR5Vro%2FWt7l9sGbQYInxQOOXlbN6yS%2FwIhANyUcRjDRi7ajy%2BrHog%2BYudC9pAcf6I6RYNPqVwbJ0VwKvMECFYQARoMNjk5NzUzMzA5NzA1IgwgXKNl2dkI8kEbawkq0ARYR%2BqZDgtcCgOsPDSFGlXVDttTjVBXjZ6uRzGTZBg%2BACToDVh9ZohImJ0XrkaR2n1eUHNye0V9g1ywTqmsxyo6QZdGWUFZ2nNcz%2FxP0v1DRuz8mx0n3HPK1dPtPgEzivQJ%2FMob9s%2Fnfs%2BkTvQXTTw26N4rbhznOl1ZrG3vYlB5henYmhf3ucPGqIMGlJQR4cdtm4Td6FfgM57rinZyp%2FHz59ROJd4PcEiCduph42pH%2FfHtd%2B6ibMlfyAAjCAEcKhl2g%2FQi2x2RUTZKxs2wNyVeF4gFqELoffhgyEuFseW3dBFmU9LLTQUXkAE0JZLR4TLcECMN1xejRiOZOhWjFo2%2Fu5Q5saXyn7JSoStpeMQpfT7%2BN2zIeLFWJF8ud%2BD7QJsR%2FgBjQmUjIWHKJBYg0VyzdtoVh19GJxZcKzeUO2lsUInt1qOyA5wDdHPoOMm0rl2HbvH3l1mhffgqOuO9FXwD8ZhfETe%2B3qxiADaJ%2BPdSZISabpH60L%2FEFY1is9Fr0ELdqX00nQrQF2lSoEu9wV1ZNkd2X1gq8eOHSB3dM4LtpBuhkh6HxdsemmwFzJSLbmKkYqwKiAeBSMR0bwRWqyMMfDBtPgD70Ctq0V9KKkMqALI2BLlIormKZhcCGGj5fmNs7eF5odaoOHR1aO6MM3Ep%2B%2BlDejyhL4k86zoPkT4obIiloq4FN7lJu7f5xb9Z3NUmz8FKBNHXK%2BfNoyM1tFbLZPdaB2kcIpV3MwJtcVn4REuqyzwyv1%2B2j0cfHAbEwPcpXrG2%2B7bT0XWK6tVxYqFaMOTshdEGOpcB7hAWyfmfzjSL93iw2mi8c22WVkYoYMLLhRxy%2FFp%2FC1j39n8oNwDfR8VmoLJdiVV2cWOw%2F4XP%2BAA3Kgaza4T3lFCa420yxmnuFn5n2W9Hvt3qgd%2Bz3dBPWd%2B40D6F7LyH73LR%2B9paiZXAglr9rQ%2BUNwUv3zShON63GsLxxVIAoZNc8b1jQKrjGNXSGUjQFrX6idaLi1V5Dw%3D%3D&Expires=1780581431)

Eso es bueno por dos razones:

- te permite usar Cloudinary como almacenamiento estándar;
    
- y te permite sustituir el backend de storage por tenant mediante conectores sin tocar el resto del pipeline.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/bffb3ea3-a30b-4e6b-b896-3bdd4a251615/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYE4BJRMJPK&Signature=K15qM6FrM4d7JxQgT9gIBIs5P50%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCIIhM0P545RuUR5Vro%2FWt7l9sGbQYInxQOOXlbN6yS%2FwIhANyUcRjDRi7ajy%2BrHog%2BYudC9pAcf6I6RYNPqVwbJ0VwKvMECFYQARoMNjk5NzUzMzA5NzA1IgwgXKNl2dkI8kEbawkq0ARYR%2BqZDgtcCgOsPDSFGlXVDttTjVBXjZ6uRzGTZBg%2BACToDVh9ZohImJ0XrkaR2n1eUHNye0V9g1ywTqmsxyo6QZdGWUFZ2nNcz%2FxP0v1DRuz8mx0n3HPK1dPtPgEzivQJ%2FMob9s%2Fnfs%2BkTvQXTTw26N4rbhznOl1ZrG3vYlB5henYmhf3ucPGqIMGlJQR4cdtm4Td6FfgM57rinZyp%2FHz59ROJd4PcEiCduph42pH%2FfHtd%2B6ibMlfyAAjCAEcKhl2g%2FQi2x2RUTZKxs2wNyVeF4gFqELoffhgyEuFseW3dBFmU9LLTQUXkAE0JZLR4TLcECMN1xejRiOZOhWjFo2%2Fu5Q5saXyn7JSoStpeMQpfT7%2BN2zIeLFWJF8ud%2BD7QJsR%2FgBjQmUjIWHKJBYg0VyzdtoVh19GJxZcKzeUO2lsUInt1qOyA5wDdHPoOMm0rl2HbvH3l1mhffgqOuO9FXwD8ZhfETe%2B3qxiADaJ%2BPdSZISabpH60L%2FEFY1is9Fr0ELdqX00nQrQF2lSoEu9wV1ZNkd2X1gq8eOHSB3dM4LtpBuhkh6HxdsemmwFzJSLbmKkYqwKiAeBSMR0bwRWqyMMfDBtPgD70Ctq0V9KKkMqALI2BLlIormKZhcCGGj5fmNs7eF5odaoOHR1aO6MM3Ep%2B%2BlDejyhL4k86zoPkT4obIiloq4FN7lJu7f5xb9Z3NUmz8FKBNHXK%2BfNoyM1tFbLZPdaB2kcIpV3MwJtcVn4REuqyzwyv1%2B2j0cfHAbEwPcpXrG2%2B7bT0XWK6tVxYqFaMOTshdEGOpcB7hAWyfmfzjSL93iw2mi8c22WVkYoYMLLhRxy%2FFp%2FC1j39n8oNwDfR8VmoLJdiVV2cWOw%2F4XP%2BAA3Kgaza4T3lFCa420yxmnuFn5n2W9Hvt3qgd%2Bz3dBPWd%2B40D6F7LyH73LR%2B9paiZXAglr9rQ%2BUNwUv3zShON63GsLxxVIAoZNc8b1jQKrjGNXSGUjQFrX6idaLi1V5Dw%3D%3D&Expires=1780581431)
    

## Modelo recomendado

Yo lo modelaría con un contrato de almacenamiento abstracto, algo así:

- `DocumentAsset`: referencia al binario, tenant, tipo, hash, versión, origen y estado.
    
- `StorageProvider`: Cloudinary o conector externo.
    
- `ConnectorProfile`: credenciales, scopes, reglas y estado del tenant.
    
- `DocumentJob`: extracción, OCR, limpieza, split/merge, render final, validación.
    

Con eso, cualquier PDF subido para extraer texto o editar páginas se guarda en el gestor documental; luego `docs` lo procesa y `templates` puede consumir el resultado para generar el PDF final.

## Trazabilidad bancaria

Aquí sí conviene ser muy estricto: **todo evento relevante** de las tres capas debe emitir auditoría inmutable a ABDLogs. Eso incluye subida, descarga, cambio de conector, extracción, OCR, limpieza, edición de páginas, render, aprobación, publicación, fallo y validación.

Para ABDLogs, el evento debería llevar como mínimo: `tenantId`, `actorId`, `app`, `action`, `entityType`, `entityId`, `assetHash`, `beforeHash`, `afterHash`, `storageProvider`, `connectorId`, `timestamp`, `result`, `correlationId`. ABDAnalytics luego puede consumir vistas materializadas o eventos agregados sin tocar datos operativos.

## Reparto de responsabilidades

La forma más limpia de encajarlo es esta:

|Capa|Responsabilidad|Guarda binario|Emite auditoría|
|---|---|---|---|
|Document Manager|Almacenamiento, versionado, conectores|Sí|Sí|
|docs.abdia.es|Extracción, OCR, limpieza, edición de páginas|No, solo referencia|Sí|
|templates.abdia.es|Gobernanza y render de PDFs finales|No, solo referencia|Sí|
|ABDLogs|Trazabilidad inmutable|No|Sí|
|ABDAnalytics|Consumo agregado / lectura|No|No transaccional|

Esto respeta el patrón de la suite: apps operativas escriben y auditan; analytics solo lee materializaciones y no hace escritura transaccional.

## Lo que yo ajustaría del documento

Yo añadiría una sección nueva de **Document Manager** y modificaría las otras dos apps para que dejen claro que trabajan con `assetRef`, no con blobs primarios. También movería la frase “todo PDF subido para extraer texto o editar páginas debe ir allí” a una regla explícita de **single source of truth del binario**.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/bffb3ea3-a30b-4e6b-b896-3bdd4a251615/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYE4BJRMJPK&Signature=K15qM6FrM4d7JxQgT9gIBIs5P50%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCIIhM0P545RuUR5Vro%2FWt7l9sGbQYInxQOOXlbN6yS%2FwIhANyUcRjDRi7ajy%2BrHog%2BYudC9pAcf6I6RYNPqVwbJ0VwKvMECFYQARoMNjk5NzUzMzA5NzA1IgwgXKNl2dkI8kEbawkq0ARYR%2BqZDgtcCgOsPDSFGlXVDttTjVBXjZ6uRzGTZBg%2BACToDVh9ZohImJ0XrkaR2n1eUHNye0V9g1ywTqmsxyo6QZdGWUFZ2nNcz%2FxP0v1DRuz8mx0n3HPK1dPtPgEzivQJ%2FMob9s%2Fnfs%2BkTvQXTTw26N4rbhznOl1ZrG3vYlB5henYmhf3ucPGqIMGlJQR4cdtm4Td6FfgM57rinZyp%2FHz59ROJd4PcEiCduph42pH%2FfHtd%2B6ibMlfyAAjCAEcKhl2g%2FQi2x2RUTZKxs2wNyVeF4gFqELoffhgyEuFseW3dBFmU9LLTQUXkAE0JZLR4TLcECMN1xejRiOZOhWjFo2%2Fu5Q5saXyn7JSoStpeMQpfT7%2BN2zIeLFWJF8ud%2BD7QJsR%2FgBjQmUjIWHKJBYg0VyzdtoVh19GJxZcKzeUO2lsUInt1qOyA5wDdHPoOMm0rl2HbvH3l1mhffgqOuO9FXwD8ZhfETe%2B3qxiADaJ%2BPdSZISabpH60L%2FEFY1is9Fr0ELdqX00nQrQF2lSoEu9wV1ZNkd2X1gq8eOHSB3dM4LtpBuhkh6HxdsemmwFzJSLbmKkYqwKiAeBSMR0bwRWqyMMfDBtPgD70Ctq0V9KKkMqALI2BLlIormKZhcCGGj5fmNs7eF5odaoOHR1aO6MM3Ep%2B%2BlDejyhL4k86zoPkT4obIiloq4FN7lJu7f5xb9Z3NUmz8FKBNHXK%2BfNoyM1tFbLZPdaB2kcIpV3MwJtcVn4REuqyzwyv1%2B2j0cfHAbEwPcpXrG2%2B7bT0XWK6tVxYqFaMOTshdEGOpcB7hAWyfmfzjSL93iw2mi8c22WVkYoYMLLhRxy%2FFp%2FC1j39n8oNwDfR8VmoLJdiVV2cWOw%2F4XP%2BAA3Kgaza4T3lFCa420yxmnuFn5n2W9Hvt3qgd%2Bz3dBPWd%2B40D6F7LyH73LR%2B9paiZXAglr9rQ%2BUNwUv3zShON63GsLxxVIAoZNc8b1jQKrjGNXSGUjQFrX6idaLi1V5Dw%3D%3D&Expires=1780581431)

Además, dejaría escrito que los conectores a repositorios de tenant son una **extensión del gestor documental**, no un invento puntual de `docs` o `templates`. Así evitas acoplar integraciones externas a dos apps distintas.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/bffb3ea3-a30b-4e6b-b896-3bdd4a251615/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYE4BJRMJPK&Signature=K15qM6FrM4d7JxQgT9gIBIs5P50%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCIIhM0P545RuUR5Vro%2FWt7l9sGbQYInxQOOXlbN6yS%2FwIhANyUcRjDRi7ajy%2BrHog%2BYudC9pAcf6I6RYNPqVwbJ0VwKvMECFYQARoMNjk5NzUzMzA5NzA1IgwgXKNl2dkI8kEbawkq0ARYR%2BqZDgtcCgOsPDSFGlXVDttTjVBXjZ6uRzGTZBg%2BACToDVh9ZohImJ0XrkaR2n1eUHNye0V9g1ywTqmsxyo6QZdGWUFZ2nNcz%2FxP0v1DRuz8mx0n3HPK1dPtPgEzivQJ%2FMob9s%2Fnfs%2BkTvQXTTw26N4rbhznOl1ZrG3vYlB5henYmhf3ucPGqIMGlJQR4cdtm4Td6FfgM57rinZyp%2FHz59ROJd4PcEiCduph42pH%2FfHtd%2B6ibMlfyAAjCAEcKhl2g%2FQi2x2RUTZKxs2wNyVeF4gFqELoffhgyEuFseW3dBFmU9LLTQUXkAE0JZLR4TLcECMN1xejRiOZOhWjFo2%2Fu5Q5saXyn7JSoStpeMQpfT7%2BN2zIeLFWJF8ud%2BD7QJsR%2FgBjQmUjIWHKJBYg0VyzdtoVh19GJxZcKzeUO2lsUInt1qOyA5wDdHPoOMm0rl2HbvH3l1mhffgqOuO9FXwD8ZhfETe%2B3qxiADaJ%2BPdSZISabpH60L%2FEFY1is9Fr0ELdqX00nQrQF2lSoEu9wV1ZNkd2X1gq8eOHSB3dM4LtpBuhkh6HxdsemmwFzJSLbmKkYqwKiAeBSMR0bwRWqyMMfDBtPgD70Ctq0V9KKkMqALI2BLlIormKZhcCGGj5fmNs7eF5odaoOHR1aO6MM3Ep%2B%2BlDejyhL4k86zoPkT4obIiloq4FN7lJu7f5xb9Z3NUmz8FKBNHXK%2BfNoyM1tFbLZPdaB2kcIpV3MwJtcVn4REuqyzwyv1%2B2j0cfHAbEwPcpXrG2%2B7bT0XWK6tVxYqFaMOTshdEGOpcB7hAWyfmfzjSL93iw2mi8c22WVkYoYMLLhRxy%2FFp%2FC1j39n8oNwDfR8VmoLJdiVV2cWOw%2F4XP%2BAA3Kgaza4T3lFCa420yxmnuFn5n2W9Hvt3qgd%2Bz3dBPWd%2B40D6F7LyH73LR%2B9paiZXAglr9rQ%2BUNwUv3zShON63GsLxxVIAoZNc8b1jQKrjGNXSGUjQFrX6idaLi1V5Dw%3D%3D&Expires=1780581431)

## Mi propuesta de encaje final

La arquitectura quedaría así:

1. **Document Manager** recibe y almacena el PDF.
    
2. Emite un evento a **ABDLogs** con el alta del asset y su hash.
    
3. `docs.abdia.es` toma el `assetRef` y ejecuta extracción/OCR/limpieza/edición.
    
4. `templates.abdia.es` toma datos y plantillas versionadas para generar el PDF final.
    
5. El PDF final se vuelve a guardar en **Document Manager**.
    
6. Cada paso deja trazabilidad inmutable en **ABDLogs**.
    
7. **ABDAnalytics** consume agregados y métricas derivadas, nunca el binario ni texto sensible en claro.
    

En resumen: **sí encaja muy bien**, pero ahora mismo pide una tercera pieza explícita, el **gestor documental**, para que la arquitectura no mezcle almacenamiento, procesamiento y gobernanza.

Si quieres, te redacto la **sección exacta para insertar en el documento** con: `Document Manager`, contrato de conectores, modelo de auditoría ABDLogs y flujo entre las tres apps.


Con lo que ya tenemos, yo lo dejaría **formalizado como una ampliación de arquitectura**, no solo como una nota de ajuste. La estructura correcta sería: **Document Manager** como sistema de almacenamiento y conectores, `docs.abdia.es` como pipeline documental, `templates.abdia.es` como gobierno y render, y `ABDLogs` como bitácora inmutable para todo lo que ocurra.

## Encaje exacto

El punto clave es que **el binario vive en Document Manager**, no en `docs` ni en `templates`, y esas dos apps operan sobre `assetRef` y no sobre blobs como responsabilidad primaria. Eso permite que Cloudinary sea el backend por defecto y que, por tenant, puedas enchufar repositorios externos sin tocar el resto del flujo.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/bffb3ea3-a30b-4e6b-b896-3bdd4a251615/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYE7SDGXGOJ&Signature=52tHbF%2FT3nJRrfwXRzD%2FWQw5K%2Bg%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCysjHqq1r3KVqz%2FAc%2Fq5KsQjHpn7W5k6bWSbGaHtzQogIhANIsH1cOnCv%2FgJ%2FUPDh5BF00N7lvlvq4SatX9gtzU20iKvMECFYQARoMNjk5NzUzMzA5NzA1IgzrAlnet2DefATRKpwq0ARj0gtEyRKeXYsgK94Ex0RuoLrGAX3mLNWMyn1p5lyanGRByqcXZZrBCnL4ewNkkAFaCooVXf39DshEq6eqhgj6xI0pf4vKGFPoKaPwLW6YgBODFdDtg5VyjXPj%2FBh%2FFVH9kHw8v4yPlU3oJQb8DNuCLBqM8gUFamzwQycbkQVzwSC2grSSwxYZVe4lGumfWmdkiNCuqiACTw1chdZq6GTIx38ee1VGdLtHOG5JygRy5zNAyTU8IAzzCd5v9lvEdfBsxm6PLHtZEFurRXUpD3jvla71DqNA70gK544rzFXrK3G3%2FlfXURy35wxREBs2P%2FTV3pz4D1g%2BZbCrbR67jVIMPNOKcR896wPVwr%2FV3pViV%2BBL3HnQnwThb%2BXKU4rtoojyBaASt8sIGp%2FoSv3f98dUXMpO24C44omRVRU6vJMgYjpIfddQ1bXHgv8HndWsaR0pZu2Vs7b8piZjH8fuicDUBESWtjpzp3MLVtIR%2BIrFI14yRtcfDiRTcBc0YexHqyjFxqdZwL59ulLtgZ6naNbNIBeh8Ahf6p6PMsMQhaq%2Fp8fRJGxQMdzeAYA94oN2l7i1csCnSmX0%2Bzwa5I06XDKFzXnBxeM%2BxJi4V3ZXNNL%2BSEj%2FDExm42a9oTIu0kY%2B1%2Buw8s8ZxtKmBtAlpYmmikkDi2m8lMWtew4MV3Yb5eTasPaC9ceoBIkeWm9XBY9%2FauO7iw%2BpTrYieFSmgz7plwzSByW4SsoSkXFDB6gHmIoiwpHG2qWJMqGbu9%2FTmHpe3C0Sx0TO44r7jzkVRTEDCNCCMKbxhdEGOpcBa9Vw%2FjXhDn8isOW5t75P24UjFYmFYxaVUkkfgXWgQPH5IVrjH%2B616cvyri5HPpPNIdvifF4h%2F7j7dc5DPrJ2HYUDl1iE5%2BaFLTPT4fsQu0edceuDR5krJiXRAnYz178MgB%2Fy7cIPM03B9dpMUgY5dRbma7DAGxowWlz6%2BrJBk9F7AmtHQHmFZ5hgcRRObmSmw0BeYmWjCQ%3D%3D&Expires=1780582009)

## Trazabilidad bancaria

La trazabilidad de grado bancario encaja mejor si cada evento de las tres capas emite auditoría a ABDLogs con hash, actor, tenant, acción, correlación y referencia al asset o documento. ABDAnalytics después solo consume métricas agregadas o vistas materializadas, nunca escritura operativa, lo cual mantiene la separación correcta entre operación y analítica.

## Lo que hay que cambiar

Yo ajustaría el documento en tres sitios:

- añadir una nueva aplicación satélite o capa formal llamada **Document Manager**;
    
- sustituir el enfoque “zero-backend” absoluto por un modelo **híbrido**;
    
- y dejar por escrito que la validación real de acciones sigue viviendo en backend/IAM, no en la UI.
    

## Redacción recomendada

Puedes encuadrarlo así:

> La suite documental de ABDSuite se compone de tres capas: un **gestor documental** responsable del almacenamiento, conectores y versionado de binarios; `docs.abdia.es`, responsable del procesamiento documental local y de la generación de derivados; y `templates.abdia.es`, responsable de la gobernanza de plantillas y la generación de PDFs finales. Todo evento relevante de estas capas se audita en ABDLogs con trazabilidad inmutable y consumible por ABDAnalytics.

> El gestor documental soporta Cloudinary como proveedor base y conectores por tenant a repositorios externos autorizados, sin que `docs` ni `templates` dependan directamente de cada integración concreta.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/bffb3ea3-a30b-4e6b-b896-3bdd4a251615/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYE7SDGXGOJ&Signature=52tHbF%2FT3nJRrfwXRzD%2FWQw5K%2Bg%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCysjHqq1r3KVqz%2FAc%2Fq5KsQjHpn7W5k6bWSbGaHtzQogIhANIsH1cOnCv%2FgJ%2FUPDh5BF00N7lvlvq4SatX9gtzU20iKvMECFYQARoMNjk5NzUzMzA5NzA1IgzrAlnet2DefATRKpwq0ARj0gtEyRKeXYsgK94Ex0RuoLrGAX3mLNWMyn1p5lyanGRByqcXZZrBCnL4ewNkkAFaCooVXf39DshEq6eqhgj6xI0pf4vKGFPoKaPwLW6YgBODFdDtg5VyjXPj%2FBh%2FFVH9kHw8v4yPlU3oJQb8DNuCLBqM8gUFamzwQycbkQVzwSC2grSSwxYZVe4lGumfWmdkiNCuqiACTw1chdZq6GTIx38ee1VGdLtHOG5JygRy5zNAyTU8IAzzCd5v9lvEdfBsxm6PLHtZEFurRXUpD3jvla71DqNA70gK544rzFXrK3G3%2FlfXURy35wxREBs2P%2FTV3pz4D1g%2BZbCrbR67jVIMPNOKcR896wPVwr%2FV3pViV%2BBL3HnQnwThb%2BXKU4rtoojyBaASt8sIGp%2FoSv3f98dUXMpO24C44omRVRU6vJMgYjpIfddQ1bXHgv8HndWsaR0pZu2Vs7b8piZjH8fuicDUBESWtjpzp3MLVtIR%2BIrFI14yRtcfDiRTcBc0YexHqyjFxqdZwL59ulLtgZ6naNbNIBeh8Ahf6p6PMsMQhaq%2Fp8fRJGxQMdzeAYA94oN2l7i1csCnSmX0%2Bzwa5I06XDKFzXnBxeM%2BxJi4V3ZXNNL%2BSEj%2FDExm42a9oTIu0kY%2B1%2Buw8s8ZxtKmBtAlpYmmikkDi2m8lMWtew4MV3Yb5eTasPaC9ceoBIkeWm9XBY9%2FauO7iw%2BpTrYieFSmgz7plwzSByW4SsoSkXFDB6gHmIoiwpHG2qWJMqGbu9%2FTmHpe3C0Sx0TO44r7jzkVRTEDCNCCMKbxhdEGOpcBa9Vw%2FjXhDn8isOW5t75P24UjFYmFYxaVUkkfgXWgQPH5IVrjH%2B616cvyri5HPpPNIdvifF4h%2F7j7dc5DPrJ2HYUDl1iE5%2BaFLTPT4fsQu0edceuDR5krJiXRAnYz178MgB%2Fy7cIPM03B9dpMUgY5dRbma7DAGxowWlz6%2BrJBk9F7AmtHQHmFZ5hgcRRObmSmw0BeYmWjCQ%3D%3D&Expires=1780582009)

> La autorización vinculante se resuelve en backend con la arquitectura IAM/Gobernanza de la suite; la interfaz solo adapta la visibilidad de acciones.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/88efccfd-16c6-4650-90e3-b5ccff5a5b0b/ARQUITECTURA_IAM_GOBERNANZA-5.md?AWSAccessKeyId=ASIA2F3EMEYE7SDGXGOJ&Signature=a8fLlmc95aOaEyGT9EZapLPodG4%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCysjHqq1r3KVqz%2FAc%2Fq5KsQjHpn7W5k6bWSbGaHtzQogIhANIsH1cOnCv%2FgJ%2FUPDh5BF00N7lvlvq4SatX9gtzU20iKvMECFYQARoMNjk5NzUzMzA5NzA1IgzrAlnet2DefATRKpwq0ARj0gtEyRKeXYsgK94Ex0RuoLrGAX3mLNWMyn1p5lyanGRByqcXZZrBCnL4ewNkkAFaCooVXf39DshEq6eqhgj6xI0pf4vKGFPoKaPwLW6YgBODFdDtg5VyjXPj%2FBh%2FFVH9kHw8v4yPlU3oJQb8DNuCLBqM8gUFamzwQycbkQVzwSC2grSSwxYZVe4lGumfWmdkiNCuqiACTw1chdZq6GTIx38ee1VGdLtHOG5JygRy5zNAyTU8IAzzCd5v9lvEdfBsxm6PLHtZEFurRXUpD3jvla71DqNA70gK544rzFXrK3G3%2FlfXURy35wxREBs2P%2FTV3pz4D1g%2BZbCrbR67jVIMPNOKcR896wPVwr%2FV3pViV%2BBL3HnQnwThb%2BXKU4rtoojyBaASt8sIGp%2FoSv3f98dUXMpO24C44omRVRU6vJMgYjpIfddQ1bXHgv8HndWsaR0pZu2Vs7b8piZjH8fuicDUBESWtjpzp3MLVtIR%2BIrFI14yRtcfDiRTcBc0YexHqyjFxqdZwL59ulLtgZ6naNbNIBeh8Ahf6p6PMsMQhaq%2Fp8fRJGxQMdzeAYA94oN2l7i1csCnSmX0%2Bzwa5I06XDKFzXnBxeM%2BxJi4V3ZXNNL%2BSEj%2FDExm42a9oTIu0kY%2B1%2Buw8s8ZxtKmBtAlpYmmikkDi2m8lMWtew4MV3Yb5eTasPaC9ceoBIkeWm9XBY9%2FauO7iw%2BpTrYieFSmgz7plwzSByW4SsoSkXFDB6gHmIoiwpHG2qWJMqGbu9%2FTmHpe3C0Sx0TO44r7jzkVRTEDCNCCMKbxhdEGOpcBa9Vw%2FjXhDn8isOW5t75P24UjFYmFYxaVUkkfgXWgQPH5IVrjH%2B616cvyri5HPpPNIdvifF4h%2F7j7dc5DPrJ2HYUDl1iE5%2BaFLTPT4fsQu0edceuDR5krJiXRAnYz178MgB%2Fy7cIPM03B9dpMUgY5dRbma7DAGxowWlz6%2BrJBk9F7AmtHQHmFZ5hgcRRObmSmw0BeYmWjCQ%3D%3D&Expires=1780582009)

## Mi recomendación

Sí, merece la pena convertir esto en una **v2.2** del documento, porque la nueva aplicación no es un detalle menor: redefine el lugar donde viven los PDFs, cómo se conectan los tenants y cómo se garantiza la auditoría. Si lo dejas explícito ahora, el equipo junior no mezclará almacenamiento, procesamiento, render y auditoría.




Te dejo la **propuesta completa de encaje y redacción**, ya convertida en una especificación lista para integrar con lo que veníamos proponiendo. La idea central es: **gestor documental como capa nueva de storage**, `docs` como pipeline de tratamiento, `templates` como gobernanza/render, y `ABDLogs` como trazabilidad inmutable para todo lo relevante.

## Encaje propuesto

La arquitectura queda en **cuatro piezas**:

- **Document Manager**: almacena PDFs, mantiene versiones, resuelve Cloudinary o conectores por tenant y expone `assetRef`.
    
- **docs.abdia.es**: extrae texto, OCR, limpieza, split/merge/reorder y produce derivados.
    
- **templates.abdia.es**: versiona plantillas, orquesta render simple/avanzado y genera PDFs finales.
    
- **ABDLogs + ABDAnalytics**: auditan todo y agregan métricas de solo lectura.
    

## Principios de diseño

La regla importante es que **el binario no pertenece a `docs` ni a `templates`**, sino al gestor documental; esas apps consumen referencias y devuelven resultados, no actúan como repositorio primario. Eso te permite cambiar Cloudinary por un repositorio del tenant sin tocar el pipeline funcional.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/bffb3ea3-a30b-4e6b-b896-3bdd4a251615/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEY7WK4CB6&Signature=x5uT9e0YYaNsQC5U9leRY3Ycqqo%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIAryw5hJnUFLJla2xERAbKOT7hud4Pmq2uLnWBJ5qoUmAiEAzoLUWKfG1B7kQsOqjJD3iJ7iENAcNPUp2uAiOm6KsWIq8wQIVhABGgw2OTk3NTMzMDk3MDUiDEp3tnzrtE%2FlwCHqYSrQBDbTzNLOqS31XHifc8Fw0s6AIqX7LV6w5%2BuU6xVMK4DJFMbeJHKmyW7vrOw1P3MNussOJGf9IODVeYlrUyFB0%2Bqa6bbImu05bHcVcsNi6DcfOXHUsiKvKGCy48ql4ZossmW1Pr%2F3NSpQTIGdtz9pZSa1l59lMARpRAuoSgfsgJ4ky%2B%2Ftb8Q43P3sv2vuvF86bksLw9TSxH4FxuZNYXu8Lv6VUT%2FpsToOTohyFA0Od3n3%2F07NY17JMl0Jei3kujRWFbPxYgNFjCe7MAuBkYXCqTPUTbr6qFX6qfZXhUdjr9ZKkG8QO5eqbgAP8tom5Wr7YOA%2Fu%2FsKaazsBkqv7j47zSk6yh5e4vYdarcK2Rx4yI2%2BFDpXzzeHJmn%2FX%2BRVLc%2BQosPSpM7BbPjKDwSD997I7mbmrLLOvR8B%2FxE4UIaSaN%2Brv%2F7uFfAPf7Q1jIT%2FUe1ppwsqkoZWDGIT9%2B6kTU4U2R3AE97MrnvvsSdSCP%2BYE7BehpL8bYAogJxC0I1j%2F2ojU67IKgtV8ueCBdqonnj3Pq9KfEpHlPpQMyi%2BCn5Gmgz%2BFzD%2Bvs9mKGabrl2CngcDIGMDhoOHAEcuwgzNmUKsTRMLpAaBy4F3rW94DTT2tc9PInDmvnWRjFI4m8o1kPGJAyLlrq6sEqt7O5tw3fXpEQH1hP4EjotKBKYLMt8OMf%2FI5XKvWdEARQ7P6JJ9cTXuVG27Xeg7AevDHc02UPgr5OKwbg536NveQsO1Yt09MzQzGRDuj52FbfF%2BdNZoX4vE2Vpw6j%2BcUWdahe1ZGoO8XnwwouGF0QY6mAFF12eBkdfynCg9grZppsPfjH%2FG%2F%2FiWyl4H9yhQJfOhvmIhJeLP5G4AGB6srqw2vOUDo5aqzj9FfzXJF17mMcZuKJkXq6%2BkWvy5BMPGv3nrSI2loU45DJyUBqhGJe3BCxXbE1csHSRGYxkUDfdO8Egv8Cn4tltyeJnLLVXmIkzSU2NANOZZMR2SxOo1wxSATcSLdSvfCpE56A%3D%3D&Expires=1780579957)

La otra regla es que la **autorización vinculante** sigue resolviéndose en backend/IAM/Gobernanza; la UI solo adapta visibilidad y ayuda a navegar permisos. Eso mantiene alineación con la arquitectura de ABDAuth y ABDtenantGobernance.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/88efccfd-16c6-4650-90e3-b5ccff5a5b0b/ARQUITECTURA_IAM_GOBERNANZA-5.md?AWSAccessKeyId=ASIA2F3EMEYEY7WK4CB6&Signature=jblsVRnR%2BUitpOsEGkzJKID6WJM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIAryw5hJnUFLJla2xERAbKOT7hud4Pmq2uLnWBJ5qoUmAiEAzoLUWKfG1B7kQsOqjJD3iJ7iENAcNPUp2uAiOm6KsWIq8wQIVhABGgw2OTk3NTMzMDk3MDUiDEp3tnzrtE%2FlwCHqYSrQBDbTzNLOqS31XHifc8Fw0s6AIqX7LV6w5%2BuU6xVMK4DJFMbeJHKmyW7vrOw1P3MNussOJGf9IODVeYlrUyFB0%2Bqa6bbImu05bHcVcsNi6DcfOXHUsiKvKGCy48ql4ZossmW1Pr%2F3NSpQTIGdtz9pZSa1l59lMARpRAuoSgfsgJ4ky%2B%2Ftb8Q43P3sv2vuvF86bksLw9TSxH4FxuZNYXu8Lv6VUT%2FpsToOTohyFA0Od3n3%2F07NY17JMl0Jei3kujRWFbPxYgNFjCe7MAuBkYXCqTPUTbr6qFX6qfZXhUdjr9ZKkG8QO5eqbgAP8tom5Wr7YOA%2Fu%2FsKaazsBkqv7j47zSk6yh5e4vYdarcK2Rx4yI2%2BFDpXzzeHJmn%2FX%2BRVLc%2BQosPSpM7BbPjKDwSD997I7mbmrLLOvR8B%2FxE4UIaSaN%2Brv%2F7uFfAPf7Q1jIT%2FUe1ppwsqkoZWDGIT9%2B6kTU4U2R3AE97MrnvvsSdSCP%2BYE7BehpL8bYAogJxC0I1j%2F2ojU67IKgtV8ueCBdqonnj3Pq9KfEpHlPpQMyi%2BCn5Gmgz%2BFzD%2Bvs9mKGabrl2CngcDIGMDhoOHAEcuwgzNmUKsTRMLpAaBy4F3rW94DTT2tc9PInDmvnWRjFI4m8o1kPGJAyLlrq6sEqt7O5tw3fXpEQH1hP4EjotKBKYLMt8OMf%2FI5XKvWdEARQ7P6JJ9cTXuVG27Xeg7AevDHc02UPgr5OKwbg536NveQsO1Yt09MzQzGRDuj52FbfF%2BdNZoX4vE2Vpw6j%2BcUWdahe1ZGoO8XnwwouGF0QY6mAFF12eBkdfynCg9grZppsPfjH%2FG%2F%2FiWyl4H9yhQJfOhvmIhJeLP5G4AGB6srqw2vOUDo5aqzj9FfzXJF17mMcZuKJkXq6%2BkWvy5BMPGv3nrSI2loU45DJyUBqhGJe3BCxXbE1csHSRGYxkUDfdO8Egv8Cn4tltyeJnLLVXmIkzSU2NANOZZMR2SxOo1wxSATcSLdSvfCpE56A%3D%3D&Expires=1780579957)

## Texto de especificación

## Sección nueva: Gestor documental

text

``## 1X. Aplicación 3: Document Manager (`documents.abdia.es` o `files.abdia.es`) ### Responsabilidad principal Centralizar el almacenamiento, versionado, recuperación y publicación de documentos PDF de la suite. Esta capa actúa como fuente de verdad del binario documental y expone referencias estables (`assetRef`) para el resto de aplicaciones. ### Funciones incluidas - Alta de documentos PDF subidos por usuarios o generados por templates. - Versionado de binarios y conservación de historial. - Integración con Cloudinary como proveedor base de almacenamiento. - Soporte para conectores alternativos por tenant hacia repositorios externos autorizados. - Resolución de permisos de acceso a nivel de asset. - Emisión de eventos de auditoría inmutables hacia ABDLogs. ### Regla de arquitectura Los satélites `docs.abdia.es` y `templates.abdia.es` no almacenan como responsabilidad primaria el binario original ni el PDF final; consumen y producen referencias de asset gestionadas por este módulo.``

## Sección nueva: contrato de conectores

text

``## 1X.1 Contrato de conectores de almacenamiento ### StorageProvider - `cloudinary` - `tenantRepository` - `s3Compatible` - `customConnector` ### ConnectorProfile - `connectorId` - `tenantId` - `providerType` - `status` - `credentialsRef` - `allowedScopes` - `retentionPolicy` - `auditMode` ### Reglas - Cloudinary será el proveedor base por defecto. - Un tenant podrá registrar uno o más conectores externos si la política de gobernanza lo permite. - El routing hacia el proveedor correcto se resolverá por `tenantId`, `documentType` y `operationType`. - Todo cambio de conector o de política de almacenamiento debe quedar auditado en ABDLogs.``

## Sección nueva: modelo de asset

text

``## 1X.2 Modelo lógico de asset documental ### DocumentAsset - `assetId` - `tenantId` - `sourceApp` - `assetType` - `storageProvider` - `storageRef` - `filename` - `mimeType` - `version` - `hash` - `createdBy` - `createdAt` - `updatedAt` - `retentionClass` - `sensitivityLevel` - `status` ### Regla Todo documento subido, editado o generado en la suite debe tener una referencia `assetRef` persistente y trazable.``

## Flujo operativo

El flujo correcto sería este:

1. El usuario sube un PDF al **Document Manager**.
    
2. El binario se guarda en Cloudinary o en el conector del tenant.
    
3. Se registra un `assetRef` y un hash.
    
4. Se emite un evento a **ABDLogs** con alta de asset.
    
5. `docs.abdia.es` toma ese `assetRef` y extrae/OCR/limpia/edita páginas.
    
6. `templates.abdia.es` toma datos y plantilla para generar el PDF final.
    
7. El PDF final vuelve al **Document Manager** como nuevo asset/version.
    
8. Cada paso deja traza en **ABDLogs**.
    
9. **ABDAnalytics** consume agregados y materializaciones, nunca escritura operativa.
    

## Trazabilidad inmutable

La auditoría debe ser de tipo bancario: cada evento relevante necesita `tenantId`, `actorId`, `action`, `entityType`, `entityId`, `assetHash`, `beforeHash`, `afterHash`, `storageProvider`, `connectorId`, `correlationId` y timestamp. Eso encaja con el enfoque de ABDLogs como capa central de trazabilidad y con ABDAnalytics como consumidor de solo lectura.

## Eventos que conviene declarar

text

`- DOCUMENT_ASSET_CREATED - DOCUMENT_ASSET_UPDATED - DOCUMENT_ASSET_MOVED - DOCUMENT_ASSET_DELETED - DOCUMENT_CONNECTOR_CHANGED - DOCUMENT_UPLOADED - DOCUMENT_EXTRACTED - DOCUMENT_OCR_COMPLETED - DOCUMENT_PAGES_REORDERED - DOCUMENT_RENDER_REQUESTED - DOCUMENT_RENDER_COMPLETED - DOCUMENT_RENDER_FAILED - DOCUMENT_VALIDATION_PASSED - DOCUMENT_VALIDATION_FAILED`

## Ajuste sobre la capacidad documental

Tu documento actual ya está bien encaminado en `docs` y `templates`, pero con este cambio hay que **sustituir el “zero-backend mandate” absoluto** por un **modelo híbrido**: ejecución local intensa para manipulación/OCR cuando convenga, y backend satélite para storage, gobernanza, sincronización, autorización y auditoría.

Eso evita el conflicto con la arquitectura general de la suite, que sí contempla backend, autorización por `authorize`, control de contexto por `tenantId` y una capa consolidada de trazabilidad y analítica.

## Redacción consolidada

Puedes pegar este bloque como cierre arquitectónico:

text

``## Veredicto arquitectónico consolidado La capacidad documental de ABDSuite se estructura en cuatro capas complementarias: 1. **Document Manager**: responsable del almacenamiento, versionado, conectores por tenant y ciclo de vida del binario documental. 2. **docs.abdia.es**: responsable del procesamiento documental, extracción, OCR, limpieza y edición estructural de páginas. 3. **templates.abdia.es**: responsable de la gobernanza de plantillas, rendering de PDFs finales y publicación controlada. 4. **ABDLogs / ABDAnalytics**: responsable de la trazabilidad inmutable y de la explotación analítica de solo lectura. El binario documental se conserva en el Document Manager y se referencia mediante `assetRef`. Los satélites consumen esas referencias sin asumir la propiedad del almacenamiento primario. Todo evento crítico de las tres capas queda auditado en ABDLogs con trazabilidad inmutable y hashes de integridad. La autorización efectiva permanece en la capa de IAM/Gobernanza; la UI adapta visibilidad, pero no sustituye la validación de backend.``

## Recomendación final

Lo más sólido es tratar esto como una **v2.2** del documento documental, añadiendo la capa de gestor documental y moviendo `docs`/`templates` a un modelo claramente desacoplado de almacenamiento. Con eso, Cloudinary, conectores por tenant y trazabilidad bancaria quedan bien alineados con la arquitectura de la suite.