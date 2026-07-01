# Handoff - ABDLanding

Este archivo describe el estado actual de la Landing corporativa de ABD Suite para el desarrollo futuro.

## Cambios Realizados

1. **Estructura base adaptada:**
   - Duplicación a partir de `ABDAnalytics` garantizando consistencia en temas, traducción y diseño visual.
   - Eliminación de modelos y lógica de base de datos irrelevante para una landing page pública.
   - Cambio de puerto por defecto en `package.json` de `3700` a `3399`.

2. **Integración del Ecosistema:**
   - Actualizado `start-all.bat` para levantar `ABDLanding` automáticamente en el puerto `3399`.
   - Modificado `superbuild.ps1` para incluir la landing en el ciclo automatizado de construcción, versión y publicación en GitHub.

3. **Navegación e Interfaz:**
   - Ajustada la configuración de `SidebarNavigation.tsx` para no depender estrictamente del login de administrador y adaptada a enlaces útiles de la suite.

## Notas para Siguientes Pasos

- **Estilos:** La landing hereda las clases CSS corporativas de `@ajabadia/styles`.
- **i18n:** Cualquier texto nuevo introducido en la landing debe definirse en `messages/es.json` y `messages/en.json` bajo la clave correspondiente.
