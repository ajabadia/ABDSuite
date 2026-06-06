# Ecosistema ABD: Guía de Estilos de Instrumentación Industrial (System Spec v3.1)

Esta guía define la estética de **instrumentación técnica** de todo el ecosistema ABD. Se aleja de los patrones comerciales tradicionales de SaaS para adoptar un lenguaje de consola técnica de alta precisión, simetría y cohesión estructural. Todo desarrollo de interfaz de usuario en las aplicaciones satélite debe ceñirse a estas reglas, empleando de forma mandatoria la biblioteca de estilos **`@ajabadia/styles`** y los componentes de barra superior unificada de **`@ajabadia/ecosystem-widgets`**.

---

## 🎨 1. Integración Cromática Global (Branding Variable System)

Para garantizar la compatibilidad absoluta con la gobernanza multi-tenant y la personalización de marca blanca en caliente, **queda terminantemente prohibido el uso de colores fijos hexadecimales hardcodeados** en las clases CSS o Tailwind de los componentes visuales operativos.

Todos los componentes deben heredar de forma fluida y transparente los tokens cromáticos definidos en las **variables de CSS globales del sistema**:

*   **Fondo Abisal (`var(--background)`)**: El lienzo oscuro de fondo para la consola.
*   **Fondo de Superficie / Tarjetas (`var(--card)`)**: Tono secundario y sobrio para paneles, bloques de código, modales y layouts de precisión.
*   **Señal de Precisión Primaria (`var(--primary)`)**: Tono de primer orden para destacar estados de éxito, progreso, focos interactivos y contornos activos (Cyan por defecto).
*   **Señal de Bypass / Retroceso (`var(--secondary)`)**: Tono para acciones de navegación auxiliar, desvíos temporales o estados de espera.
*   **Línea Limítrofe / Separadores (`var(--border)`)**: Tono sutil e inerte para delimitar secciones, cards y estados sin sobrecargar la UI.
*   **Alerta y Error (`var(--destructive)`)**: Tono rojo para indicar peligro, errores críticos o borrados.
*   **Advertencia (`var(--warning)`)**: Tono ámbar para notificar atención requerida o estados de revisión.
*   **Texto Principal de Alta Claridad (`var(--foreground)`)**: Tipografía principal optimizada para un excelente contraste de lectura.

---

## ⚖️ 2. Leyes del Contenedor y Zona de Seguridad de la Navbar

Para evitar desalineaciones visuales e impedir que el contenido se superponga o quede oculto detrás de la barra superior fija, los layouts deben respetar el siguiente posicionamiento:

*   **Main Container (Warp)**: El tag principal `<main>` debe utilizar la clase de seguridad **`.navbar-top-layout`** (definida en el CSS consolidado como `padding-top: 56px`) para dejar libre el espacio de la Navbar superior fija, complementado por padding interno adaptativo:
    `className="min-h-screen navbar-top-layout bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main"`
*   **Inner Wrapper (Limit)**: El contenedor interno de ancho restringido debe alinearse al centro del viewport:
    `className="max-w-7xl mx-auto flex flex-col gap-10"`

---

## 📐 3. Anatomía Unificada de Cabeceras (The Header Architecture)

El bloque de cabecera debe ser uniforme en toda la aplicación. Se prohíbe maquetar cabeceras manuales en el código. Se debe utilizar el componente correspondiente de la biblioteca de estilos:

### A. Para Pantallas de Administración y Gestión
Se debe utilizar **`AdminPageHeader`** de `@ajabadia/styles`:
```tsx
import { AdminPageHeader } from '@ajabadia/styles';
import { FolderOpen } from 'lucide-react';

<AdminPageHeader
  icon={FolderOpen}
  breadcrumb={<>{t('breadcrumbs.governance')} • {t('breadcrumbs.exams')}</>}
  title={t('examsTitle')}
  backButton={
    <Link href={`/${locale}/admin`} className="btn-secondary-console p-2">
      <ArrowLeft size={14} />
    </Link>
  }
  description={t('examsSubtitle')}
>
  {/* Slot para botones de acción principal a la derecha */}
  <Button className="btn-primary-console">
    <Plus className="w-4 h-4 mr-2" />
    {t('newExam')}
  </Button>
</AdminPageHeader>
```

### B. Para Pantallas de Bienvenida / Hero Landing
Se debe utilizar **`HeroHeader`** de `@ajabadia/styles` en el portal de entrada de la aplicación satélite:
```tsx
import { HeroHeader } from '@ajabadia/styles';

<HeroHeader
  statusText={h('status')}
  title={
    <>{t('brandPart1')}<span className="text-primary">{t('brandPart2')}</span></>
  }
  description={h('tagline')}
/>
```

---

## 📂 4. Barra de Navegación Superior Unificada (`SmartNavbar`)

La navegación global de la aplicación está unificada en el componente de cabecera fija superior **`SmartNavbar`** de `@ajabadia/ecosystem-widgets`. **Queda estrictamente prohibido el uso de barras de navegación laterales (Sidebars) independientes o manuales.**

### A. Anatomía y Elementos de SmartNavbar
*   **Chasis Superior**: Altura fija de `56px`, fondo de superficie translúcido con desenfoque (`backdrop-filter: blur(16px)`), y borde inferior fino (`border-b border-border`).
*   **Barra de Acento de Progreso**: Una línea fina de `1px` o `2px` en el borde inferior que brilla con el tono primario activo del tenant, denotando actividad y conexión del sistema.
*   **Debug/Info Tag del Tenant**: Una etiqueta monospace visible a la derecha que muestra el identificador del tenant actual (ej. `[TENANT: QZ_DEV]`) para auditoría rápida en caliente de los administradores.
*   **Mega-Menú de Navegación**: Los enlaces se agrupan en cascada o menús desplegables sobre la barra superior. Se prohíbe el uso de menús laterales fijos (Drawers) que roben espacio horizontal de trabajo en la consola.

### B. Consumo e Integración en Layout
```tsx
import { SidebarNavigation } from "@/components/layout/SidebarNavigation"; // Wrapper local de SmartNavbar
import { TenantSelector } from "@/components/ui/TenantSelector";

// En layout.tsx
<SidebarNavigation 
  session={session} 
  tenantSelectorSlot={session.authenticated ? <TenantSelector sessionUser={session.user} /> : undefined}
/>
```

---

## ⚙️ 5. Componentes de Mando y Botones Generales

Queda terminantemente prohibido escribir clases de Tailwind inline complejas o estilos locales para botones estándar de consola. Se deben emplear de forma mandatoria las clases consolidadas de `@ajabadia/styles` inyectadas en la hoja de estilos global:

*   **Bordes Afilados**: Borde totalmente rígido (`rounded-none`).
*   **Casing de Botones**: Textos de acción en **MAYÚSCULAS** (`uppercase`) y tipografía `font-mono`.
*   **Botón de Avance / Acción Principal (`.btn-primary-console`)**:
    Fondo transparente, borde fino primario que se ilumina y se rellena de forma translúcida al pasar el cursor:
    `className="btn-primary-console"`
*   **Botón de Retroceso / Auxiliar (`.btn-secondary-console`)**:
    Fondo transparente con borde neutro de contraste que se atenúa suavemente en el hover:
    `className="btn-secondary-console"`
*   **Botón de Destrucción / Alerta (`.btn-destructive-console`)**:
    Borde destructivo rojo que se ilumina con sombra de emergencia en el hover:
    `className="btn-destructive-console"`
*   **Botón de Omisión / Punteado (`.btn-skip-console`)**:
    Borde discontinuo (`dashed`) para acciones secundarias o saltos de sección:
    `className="btn-skip-console"`

---

## 🔤 6. Estándar de Capitalización (Casing Rules)

| Elemento UI | Capitalización (Casing) | Tipografía | Propósito |
| :--- | :--- | :--- | :--- |
| **Micro-Tags / Metadatos** | `ALL_UPPERCASE` | `Geist Mono` | Códigos de log, versión, estados de auditoría, etiquetas de filtros. |
| **Rutas (Breadcrumbs)** | `ALL_UPPERCASE` | `Geist Mono` | Ubicación jerárquica en la barra superior. |
| **Textos de Botones** | `ALL_UPPERCASE` | `Geist Mono` | Evocar mandos de control industriales. |
| **Títulos de Página** | `ALL_UPPERCASE` | `Geist Sans` (Italic) | Foco principal y carácter de consola técnica. |
| **Enunciados / Explicaciones** | `Sentence-case` | `Geist Sans` | Lectura cómoda, natural y libre de fatiga cognitiva. |

---

## 🎛️ 7. Anatomía de Formularios y Campos de Entrada (Form Controls Spec)

Para evitar la desalineación de inputs de texto y selectores, se debe utilizar la estructura unificada provista por el paquete de estilos:

*   **Chasis del Input (`.input-console`)**:
    Clase CSS unificada que define la altura rígida, padding, bordes afilados (`rounded-none`), color de fondo sobre superficie y foco interactivo con sombra translúcida cyan:
    ```tsx
    <input 
      type="text" 
      className="input-console" 
      placeholder={t('placeholder')} 
    />
    ```
*   **Selectores y Buscadores Complejos**:
    *   Queda prohibido utilizar los menús `select` nativos y planos del navegador para la selección de entidades críticas (como espacios, cursos, o buscadores de usuarios).
    *   Se deben implementar selectores flotantes adaptados que mantengan el chasis rígido de `.input-console` y desplieguen un menú flotante con efecto de cristal oscuro (`bg-background/95 border border-border rounded-none shadow-2xl`), manteniendo la coherencia simétrica de la consola.
*   **Etiquetas de Entrada (Labels)**:
    Posicionadas siempre arriba del input con tipografía monospace microscópica, extra negrita y en mayúsculas:
    `className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-2"`

---

## 📊 8. Tablas de Telemetría e Índices de Datos (Technical Tables)

Las tablas representan consolas de diagnóstico y deben huir de los estilos redondeados o de celdas separadas de los SaaS tradicionales:

*   **Chasis de la Tabla (Table Frame)**:
    Contenedor con scroll horizontal habilitado, bordes finos e inerte:
    `className="overflow-x-auto border border-border rounded-none bg-card/40 backdrop-blur-sm"`
*   **Fila de Encabezados (Table Header Row)**:
    Fondo atenuado de control (`bg-secondary/40`). Celdas `<th>` con padding uniforme, alineación izquierda y tipografía monospace técnica en mayúsculas:
    `className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground"`
*   **Filas de Contenido (`<tr>` / `<td>`)**:
    *   Hover de fila completo para lectura rápida: `hover:bg-primary/[0.02] transition-colors duration-150`.
    *   Celdas `<td>` con padding regular y texto Geist Sans (`px-6 py-4 text-xs font-sans text-foreground/90`).
    *   **Monospace Columns**: Aquellas columnas con UUIDs, fechas, IPs, roles o códigos de máquina deben renderizarse obligatoriamente en tipografía monospace pequeña: `className="font-mono text-[10px] font-bold text-muted-foreground/80"`.

---

## 🚨 9. Alertas, Toasts y Diálogos de Confirmación

*   **Cuadros de Alerta Local (In-Page Alerts)**:
    Contenedor flexible con fondo y bordes muy tenues de color de advertencia y texto en tipografía monospace de alta legibilidad:
    *   *Error/Fallo*: `className="p-4 border border-red-500/15 bg-red-500/5 text-red-500 font-mono text-[10px] font-black uppercase tracking-wider rounded-none"`
    *   *Advertencia*: `className="p-4 border border-amber-500/15 bg-amber-500/5 text-amber-500 font-mono text-[10px] font-black uppercase tracking-wider rounded-none"`
*   **Diálogos de Confirmación (`ConfirmDialog`)**:
    Para acciones destructivas (como borrar un examen o configuración), se debe utilizar el hook `useConfirmDialog` o el componente modal **`ConfirmDialog`** de `@ajabadia/ecosystem-widgets` para evitar la creación de modales ad-hoc inconsistentes.

---

## 🟢 10. Píldoras de Estado y Telemetría Rápida (Status Indicators)

*   **Punto Pulsante (Dynamic Diagnostic Dot)**:
    Para estados activos o latencias en tiempo real, se inyecta el componente estándar con anillo parpadeante exterior:
    ```tsx
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
    </span>
    ```
*   **Contenedor de Píldora (Status Badge)**:
    `className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/50 border border-border text-[9px] font-mono font-black uppercase tracking-[0.2em] text-muted-foreground rounded-none"`
    *   `ONLINE` / `ACTIVO` $\rightarrow$ Texto/Punto verde esmeralda (`text-emerald-500`/`bg-emerald-500`).
    *   `OFFLINE` / `DEPRECIADO` $\rightarrow$ Texto/Punto rojo vivo (`text-red-500`/`bg-red-500`).
    *   `PENDIENTE` $\rightarrow$ Texto/Punto amarillo/ámbar (`text-amber-500`/`bg-amber-500`).

---

## 🛠️ 11. Estándar de Construcción (Fire Rules)

1.  **FIRE:MAX_LINES**: Máximo **150 líneas** por componente/archivo para forzar modularidad estricta.
2.  **FIRE:I18N_VIOLATION**: Prohibido el uso de strings literales en JSX. Todo debe resolverse a través de los archivos de localización usando `next-intl`.
3.  **FIRE:A11Y_VIOLATION**: Atributo `alt` obligatorio en imágenes; `aria-label` en botones interactivos mudos.
4.  **FIRE:NO_EMBEDDED_CSS/SCRIPTS**: Prohibido inyectar bloques `<style>` de forma directa en las páginas. El sistema inyecta las variables de marca del tenant de forma dinámica en la cabecera `<head>` de Next.js usando el componente servidor `<ThemeScript />` de `@ajabadia/styles` para prevenir el FOUC (parpadeos visuales).
5.  **FIRE:LAYOUT_VIOLATION**: Queda terminantemente prohibido forzar márgenes absolutos o paddings de compensación lateral en el enrutamiento de las páginas (tales como `ml-64`, `pl-20`, etc.) para simular sidebars ficticios. Con la barra de navegación superior unificada, el contenido debe fluir libre y centrado en el viewport bajo la clase `.navbar-top-layout`.

---

## 🛠️ 12. Guía de Inicio Rápido: Patrones de Código Reales (Quick-Start Examples)

Para evitar cualquier margen de error o improvisación por parte de perfiles de desarrollo junior, a continuación se detallan los tres esqueletos de código fundamentales que deben copiarse y adaptarse para cualquier pantalla nueva:

### Ejemplo A: Estructura del Layout de Página
Este snippet muestra cómo maquetar la cabecera del módulo (`AdminPageHeader`) dentro de la estructura fluida que respeta el espacio de la barra superior (`navbar-top-layout`) sin márgenes artificiales:

```tsx
// src/app/[locale]/admin/exams/page.tsx
import { AdminPageHeader } from '@ajabadia/styles';
import { FolderOpen } from 'lucide-react';
import Link from 'next/link';

export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  
  return (
    <main className="min-h-screen navbar-top-layout bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Cabecera Unificada */}
        <AdminPageHeader
          icon={FolderOpen}
          breadcrumb={<>GOBERNANZA • EXÁMENES</>}
          title="Gestión de Exámenes"
          backButton={
            <Link href={`/${locale}/admin`} className="btn-secondary-console p-2.5" aria-label="Volver">
              {/* ArrowLeft de lucide-react */}
            </Link>
          }
          description="Administración de plantillas de evaluación del tenant."
        >
          <button className="btn-primary-console h-12 px-6">
            CREAR EXAMEN
          </button>
        </AdminPageHeader>

        {/* El resto de la vista fluye de forma vertical centrado y flexible */}
        <div className="flex flex-col gap-6">
          {/* Componentes operacionales */}
        </div>

      </div>
    </main>
  );
}
```

### Ejemplo B: Formularios y Controles de Mando (.input-console y .btn-*)
Este snippet detalla cómo estructurar campos de entrada utilizando etiquetas monospace, la clase unificada `.input-console` y botones del chasis de consola:

```tsx
// src/components/admin/ExamForm.tsx
import { useTranslations } from 'next-intl';

export function ExamForm() {
  const t = useTranslations('admin');

  return (
    <form className="bg-card border border-border p-8 rounded-none flex flex-col gap-6 max-w-xl">
      
      {/* Campo de Texto */}
      <div className="flex flex-col">
        <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-2">
          NOMBRE DEL EXAMEN
        </label>
        <input 
          type="text" 
          className="input-console h-10" 
          placeholder="Escriba el nombre identificativo..." 
        />
      </div>

      {/* Selector Personalizado Simétrico (No Select Nativo) */}
      <div className="flex flex-col relative">
        <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-2">
          NIVEL DE DIFICULTAD
        </label>
        
        {/* Chasis de Input para simular Selector con estilo Cristal Oscuro */}
        <div className="input-console h-10 flex items-center justify-between cursor-pointer">
          <span>SELECCIONAR NIVEL...</span>
          <span className="text-[8px]">▼</span>
        </div>
        
        {/* Dropdown flotante (Renderizado bajo eventos en estado React) */}
        <div className="absolute top-[68px] left-0 w-full bg-background/95 border border-border rounded-none shadow-2xl z-50 flex flex-col">
          <button type="button" className="px-4 py-3 text-left text-xs hover:bg-primary/5 hover:text-primary font-mono border-b border-border/40">FÁCIL</button>
          <button type="button" className="px-4 py-3 text-left text-xs hover:bg-primary/5 hover:text-primary font-mono border-b border-border/40">MEDIO</button>
          <button type="button" className="px-4 py-3 text-left text-xs hover:bg-primary/5 hover:text-primary font-mono">DIFÍCIL</button>
        </div>
      </div>

      {/* Fila de Botones */}
      <div className="flex justify-end gap-4 border-t border-border pt-6">
        <button type="button" className="btn-secondary-console">
          CANCELAR
        </button>
        <button type="submit" className="btn-primary-console">
          GUARDAR CONFIGURACIÓN
        </button>
      </div>

    </form>
  );
}
```

### Ejemplo C: Tablas de Telemetría e Identificadores (UUID en Monospace)
Este snippet muestra cómo maquetar tablas sin bordes redondeados y formateando de manera mandatoria columnas de UUID o metadatos de máquina en monospace:

```tsx
// src/components/admin/TableAttempts.tsx
export function TableAttempts({ attempts }) {
  return (
    <div className="overflow-x-auto border border-border rounded-none bg-card/40 backdrop-blur-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="px-6 py-4 text-left font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">ID INTENTO</th>
            <th className="px-6 py-4 text-left font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">ALUMNO</th>
            <th className="px-6 py-4 text-left font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">PUNTUACIÓN</th>
            <th className="px-6 py-4 text-left font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">FECHA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {attempts.map((attempt) => (
            <tr key={attempt._id} className="hover:bg-primary/[0.02] transition-colors duration-150">
              {/* Columna Monospace (UUID) */}
              <td className="px-6 py-4 font-mono text-[10px] font-bold text-muted-foreground/80">
                {attempt._id.slice(-8).toUpperCase()}
              </td>
              <td className="px-6 py-4 text-xs font-sans text-foreground/90">
                {attempt.userName}
              </td>
              <td className="px-6 py-4 text-xs font-sans text-foreground/90 font-bold">
                {attempt.percentage}%
              </td>
              {/* Columna Monospace (Fecha) */}
              <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground/80">
                {new Date(attempt.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---
**Certificado: SYS_READY (Instrumentation Layer v3.1 - Symmetric Multi-Tenant Component Standard)**

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ROADMAP.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/ABDEcosystemWidgets.md]]
