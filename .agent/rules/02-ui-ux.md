# 02-UI/UX: Estética Industrial y Fluidez Aseptic (Era 6.1)

## 1. Estética Industrial High-Fidelity
- **Aseptic Retro-Minimalist**: Diseño basado en rejillas técnicas, tipografía monoespaciada para datos y bordes definidos.
- **Zero-Placeholder Policy**: No usar imágenes genéricas. Generar activos industriales si es necesario.
- **Design Tokens**: Uso OBLIGATORIO de variables CSS definidas en `src/styles/tokens.css`. Prohibido el hardcoding de colores o espaciados.
- **Global Style Priority (DRY UI)**: Es OBLIGATORIO utilizar los estilos y clases generales definidos en `src/styles/` (ej: `.station-card`, `.flex-row`) antes de crear estilos propios. Se prohíbe la creación de estilos locales que repliquen o sean muy similares a los globales.
- **Vanilla CSS Mandate**: No usar Tailwind CSS ni Shadcn UI a menos que se indique explícitamente una migración. El estilo debe seguir el sistema de componentes industriales ya definido.

## 2. Feedback y Comunicación con el Operador
- **Terminal Log Console**: Las operaciones técnicas (cifrado, ETL, generación) deben volcar su progreso detallado en el componente `LogConsole` interno.
- **Visual Feedback**: Uso de estados visuales claros (Loading, Success, Warning, Error) en botones y paneles de estado.
- **Toasts**: Implementar feedback ligero para acciones rápidas mediante el sistema de notificaciones de la suite.

## 3. Navegación y Estaciones de Trabajo
- **Progressive Wizard**: Flujos de trabajo guiados por un asistente que bloquea pasos siguientes hasta completar los requisitos de seguridad y datos del paso actual.
- **Workstation Isolation**: Cada centro de trabajo (Crypt Station, ETL Studio, Letter Station) debe ser visualmente distinguible pero coherente con el sistema global.
- **Modal Logic**: Uso de modales industriales para configuraciones profundas o confirmaciones críticas de borrado.

## 4. Accesibilidad (Industrial Grade)
- **Keyboard Navigation**: Toda la suite debe ser operable mediante teclado (Tab-indexing correcto).
- **ARIA Standards**: Uso de atributos descriptivos para lectores de pantalla en paneles de datos complejos.
- **Focus Integrity**: Mantener el foco visible y gestionado durante la apertura y cierre de diálogos.

## 5. Gestión de Datos y Rendimiento UI
- **Offline First Virtualization**: Uso de virtualización de listas para manejar miles de registros locales en IndexedDB sin degradar el rendimiento del DOM.
- **Memory Hygiene**: Asegurar que los componentes liberen referencias a grandes buffers de archivos (Blobs, ObjectURLs) al ser desmontados.
- **Debounced Inputs**: Todas las búsquedas en tiempo real sobre la base de datos Dexie deben estar debounced.

## 6. Paridad GAWEB v1
- **Visual Accuracy**: Las previsualizaciones de documentos en la `Letter Station` deben reflejar con precisión industrial el resultado final del documento generado.
- **Print Parity**: El diseño de los informes debe estar optimizado para impresión y exportación a PDF manteniendo la integridad estructural.
