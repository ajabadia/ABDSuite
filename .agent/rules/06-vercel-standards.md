# 06-Vercel & Next.js Excellence Standards (Era 6.1)

Este módulo integra las directrices de ingeniería para aplicaciones Next.js de alto rendimiento, adaptadas a la arquitectura industrial de la suite.

## 1. Next.js 16 & React 19 Best Practices
- **Client-Side Heavy Architecture**: Dado que la suite es **Offline-First**, la mayoría de la lógica de procesamiento reside en `Client Components`. Use `'use client'` de forma estratégica.
- **Server Components for Shell**: Use Server Components para renderizar la estructura estática (Shell), menús y configuraciones iniciales que no cambian, reduciendo el tiempo hasta la interactividad (TTI).
- **Streaming & Suspense**: Implemente `Suspense` para mostrar esqueletos industriales (Skeletons) mientras se cargan los datos desde IndexedDB o se inicializa el motor criptográfico.
- **Turbopack Optimization**: Aproveche el compilador Turbopack para iteraciones rápidas. Evite configuraciones pesadas de `next.config.js` que ralenticen el desarrollo.

## 2. Client Performance & Resource Management
- **Web Workers for Crypto**: Toda operación criptográfica pesada (PBKDF2, AES masivo) debe ser delegada a Web Workers para evitar bloqueos del hilo principal.
- **Virtualization**: Obligatorio el uso de técnicas de virtualización de listas para el renderizado de miles de registros regulatorios en la `ETL Studio`.
- **Memory Leak Prevention**: Gestión estricta de `useEffect` y `useMemo` para liberar recursos de archivos masivos inmediatamente después de su procesamiento.
- **Dexie Query Optimization**: Utilice índices y consultas optimizadas para evitar lecturas completas de tablas en stores grandes.

## 3. Industrial Web Design (Aseptic UI)
- **Cumulative Layout Shift (CLS)**: Asegure dimensiones fijas para paneles y estaciones de trabajo para evitar saltos visuales durante la carga de módulos.
- **Tabular Numbers**: Uso obligatorio de `font-variant-numeric: tabular-nums` en todas las rejillas de datos técnicos y financieros.
- **Reduced Motion**: Respetar la preferencia del sistema `prefers-reduced-motion` en las micro-animaciones industriales.
- **Industrial Typography**: Uso de fuentes monoespaciadas y sans-serif de alta legibilidad para garantizar la precisión en la lectura de códigos y UUIDs.

## 4. Advanced Composition Patterns
- **Compound Components**: Seguir el patrón de composición para componentes de UI industriales complejos (ej: `Wizard.Step`, `DataTable.Cell`) para evitar el "prop drilling".
- **Ref forwarding**: En React 19, pasar `ref` como una prop estándar. Use `useImperativeHandle` solo cuando sea estrictamente necesario para el control de estaciones de trabajo externas.
- **Custom Hooks for Services**: Encapsular la lógica de los servicios locales (Crypto, Audit, ETL) en hooks personalizados para facilitar su consumo en componentes funcionales.
