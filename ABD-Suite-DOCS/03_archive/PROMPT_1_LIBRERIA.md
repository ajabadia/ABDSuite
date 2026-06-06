# 📦 PROMPT 1: Actualización de la Librería `@abd/styles`

**Objetivo**: Convertir `@abd/styles` en el proveedor único del chasis visual y de los componentes interactivos compartidos de la suite.

---

## 🛠️ Tareas a Ejecutar en el Repositorio `ABDStyles`

### 1. Añadir dependencias de UI
Abre `package.json` y añade `react` y `lucide-react` a las `peerDependencies` para permitir exportar componentes sin duplicar librerías en los satélites:
```json
"peerDependencies": {
  "react": "^19.0.0",
  "lucide-react": "^0.46.0"
}
```

### 2. Crear la Hoja de Estilos Core (`src/styles/industrial-core.css`)
Crea este archivo e incluye la declaración unificada de patrones, variables HSL por defecto, animaciones, scrollbar y utilidades:
```css
@theme inline {
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
}

/* 🌑 Dark Mode (Aseptic Deep Black - Default) */
:root, .dark {
  --background: 0 0% 4%;
  --foreground: 0 0% 96%;
  --card: 0 0% 8%;
  --card-foreground: 0 0% 96%;
  --popover: 0 0% 8%;
  --popover-foreground: 0 0% 96%;
  --primary: 188 85% 48%; 
  --primary-foreground: 0 0% 100%;
  --warning: 38 92% 52%; 
  --secondary: 0 0% 12%;
  --secondary-foreground: 0 0% 92%;
  --muted: 0 0% 10%;
  --muted-foreground: 0 0% 68%;
  --accent: 188 80% 18%;
  --accent-foreground: 0 0% 96%;
  --destructive: 0 72% 45%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 16%;
  --input: 0 0% 16%;
  --ring: 188 85% 48%;
  --radius: 0.15rem;
}

/* ⚪ Light Mode (Industrial Grey / White) */
.light {
  --background: 0 0% 98%;
  --foreground: 0 0% 8%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 8%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 8%;
  --primary: 188 85% 38%; 
  --primary-foreground: 0 0% 100%;
  --warning: 38 92% 45%; 
  --secondary: 0 0% 90%;
  --secondary-foreground: 0 0% 10%;
  --muted: 0 0% 94%;
  --muted-foreground: 0 0% 45%;
  --accent: 188 80% 90%;
  --accent-foreground: 188 85% 20%;
  --destructive: 0 72% 40%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 86%;
  --input: 0 0% 86%;
  --ring: 188 85% 38%;
}

/* 🌌 Scrollbars Industriales */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 0px;
}
::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--primary) / 0.5);
}

/* 🧪 Utilidades y Efectos de Consola */
@utility bg-industrial-grid {
  background-image: linear-gradient(to right, hsl(var(--foreground) / 0.08) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--foreground) / 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
}

@utility mask-industrial-fade {
  mask-image: radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%);
}

@utility glass-panel {
  backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border) / 0.2);
  background-color: hsl(var(--card) / 0.4);
}

@utility bg-grain {
  position: fixed;
  inset: 0;
  background-image: url("https://grainy-gradients.vercel.app/noise.svg");
  opacity: 0.03;
  pointer-events: none;
  z-index: 1;
}

/* Botones Base */
.btn-primary-console {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid hsl(var(--primary) / 0.5);
  padding: 0.75rem 1.5rem;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: all 150ms ease-in-out;
  border-radius: 0px;
  background: transparent;
  color: hsl(var(--primary));
  cursor: pointer;
}

.btn-primary-console:hover {
  background: hsl(var(--primary) / 0.1);
  border-color: hsl(var(--primary));
  box-shadow: 0 0 15px hsl(var(--primary) / 0.1);
}
```

### 3. Copiar y Exponer Archivo CSS en la Carpeta `dist`
Dado que `tsc` no copia archivos CSS de forma nativa a la carpeta `dist`, actualiza el script `build` en `package.json` para copiar el archivo CSS:
```json
"scripts": {
  "build": "tsc && powershell -Command \"Copy-Item -Path src/styles -Destination dist -Recurse -Force\""
}
```

### 4. Crear los Componentes React Unificados en `src/components`
Muda y abstrae `SystemSettings.tsx` y `TacticalSidebar.tsx` a la librería. 
*   **SystemSettings**: Debe ser agnóstico de `next-intl` (recibir las traducciones ya calculadas del proyecto padre por props) o bien usar triggers neutros de cambio de idioma.
*   **TacticalSidebar**: Debe recibir la lista de enlaces de navegación dinámicamente:
    ```tsx
    interface SidebarLink {
      href: string;
      label: string;
      icon: React.ReactNode;
    }
    ```
*   Exponlos en `src/index.ts`.

### 5. Compilar y Subir a GitHub
Ejecuta la compilación de la librería y haz push a tu rama principal de GitHub:
```powershell
npm run clean
npm run build
git add .
git commit -m "feat: centralize core styles and ui components"
git push origin main
```
