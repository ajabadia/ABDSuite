# Guía de Referencia Técnica Aseptic v4

Esta guía es el **Contrato de Diseño** oficial de la ABDFN Unified Suite. No describe colores, sino **arquitectura y responsabilidades**.

## 1. Arquitectura de Estilos Modular
El diseño se gestiona mediante módulos atómicos en `src/styles/`. Está terminantemente **PROHIBIDO** crear estilos locales (`.module.css`) que repliquen funcionalidades globales.

### Estructura de Archivos
| Archivo | Responsabilidad |
| :--- | :--- |
| `tokens.css` | **Fuente de la Verdad**. Variables CSS (`--bg-color`, `--primary-color`). |
| `base.css` | Reset industrial, tipografía base y clases de utilidad de texto. |
| `layout.css` | Dimensiones del Shell, Sidebar y motor de Scrollbars. |
| `components.css` | **Núcleo Industrial**. Definición de Registros, Tablas y Botones. |
| `utilities.css` | Animaciones (Shimmer), Estados Vacíos y Grid helpers. |
| `legacy-audit.css` | Herramienta de auditoría visual (Colores neón para detectar deuda técnica). |

## 2. Mapa de Clases Industriales

### Contenedores de Registro (`station-registry`)
Define el bloque principal de gestión de datos (Plantillas, Mapeos).
- **Ubicación**: `components.css`.
- **Componentes**: `.station-registry-header`, `.station-registry-content`.

### Sistema de Botones (`station-btn`)
Los botones deben ser consistentes en peso y altura.
- **Primario**: `.station-btn-primary`. Siempre para la acción principal.
- **Registro (Main)**: `.station-registry-btn-main` (Altura 48px, peso 900).
- **Registro (Side)**: `.station-registry-btn-side` (Botón cuadrado de 64px para importación).

## 5. Diccionario de Iconos Estándar
Todos los iconos de la suite deben vivir exclusivamente en un único archivo centralizado: `@/components/common/Icons`. Está terminantemente **PROHIBIDO** crear bibliotecas de iconos locales o por aplicación.

### Iconos Approved:
- **Crear**: `PlusIcon` o Prefijo `[+]`
- **Importar/Carga**: `UploadIcon` (Standard para backups/presets)
- **Exportar/Descarga**: `DownloadIcon`
- **Configuración**: `CogIcon`
- **Eliminar**: `TrashIcon` (Color `--status-err`)
- **Navegación**: `ListIcon`, `MapIcon`.

### Estados Vacíos y Shimmer
Nunca uses una div vacía con texto estático.
- **Contenedor**: `.station-empty-state` (Padding y alineación estándar).
- **Texto**: `.station-shimmer-text` (Brillo animado definido en `utilities.css`).

## 3. Reglas de Contribución y Refactorización
1. **Prioridad Global**: Antes de escribir una sola línea de CSS, busca si existe la clase en `components.css`.
2. **Audit System**: Si ves elementos con **bordes magenta neón o cian**, significa que aún usan clases en fase de revisión o locales que deben ser migradas al estándar global.
3. **Inmutabilidad de Tokens**: Nunca hardcodees un color en un componente. Usa siempre `var(--primary-color)`, `var(--border-color)`, etc.

---

## 3. Registro Maestro (Registries)
Los registros deben ser el punto de entrada de cada estación, con una barra de acciones unificada y discreta bajo el patrón "Registry-First".

**Estructura de la Barra de Acciones:**
- **Sincronización (Izquierda)**: Botones técnicos discretos (`station-btn-side`) para mover datos masivos:
    - `JSON↓`: Exportación total del almacén local a JSON.
    - `ALL↑`: Importación/Sincronización maestra desde JSON (Archivado).
- **Acción Primaria (Derecha)**: Botón principal de creación (`station-btn-primary`) ocupando el espacio restante o con un ancho máximo controlado.

> [!TIP]
> Esta disposición elimina la necesidad de bloques de sincronización secundarios, manteniendo la limpieza visual del terminal.

## 4. Cabecera Industrial de Estación (Aseptic v4)
Todas las pantallas de configuración técnica deben seguir el patrón de cabecera unificado para metadatos generales:

- **Título Principal**: Nombre del recurso en H2 (mayúsculas).
- **Metadata Badges**: Inmediatamente debajo del título, indicando Versión (v1.0) y Estado (ACTIVO/BORRADOR).
- **Resumen Técnico**: Debajo de una línea separadora, campos clave de solo lectura (Origen, Lote, Variables, etc).
- **Toolbar de Acciones**: 
    - **Configuración (Rueda)**: Abre modal para editar metadatos generales.
    - **Guardado**: Acción persistente principal.
    - **Previsualización (Opcional)**: Despliega panel inferior colapsable.

## 5. Paneles y Animaciones
- Los registros deben usar `.station-registry-anim-container` para colapsos suaves.
- Las previsualizaciones deben ser paneles inferiores colapsables que no bloqueen el flujo de edición principal.
