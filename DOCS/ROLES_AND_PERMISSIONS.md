# ABDFN Suite – Roles y Permisos

## Roles

- **ADMIN**  
  Gobierno completo de la suite, configuración global, gestión de operadores y acceso total a todos los módulos.

- **TECH**  
  Perfil técnico: diseña modelos (ETL, LETTER), ejecuta procesos y auditorías, pero no gestiona usuarios ni configuración global de la suite.

- **OPERATOR**  
  Perfil operativo: usa los módulos (cifrar, ejecutar ETL, generar cartas, lanzar auditorías) sin modificar modelos ni políticas globales.


## Capacidades

### CRYPT

| Capability            | Descripción                                              |
|-----------------------|----------------------------------------------------------|
| CRYPT_USE             | Usar CRYPT STATION para cifrar/descifrar.               |
| CRYPT_CONFIG_GLOBAL   | Cambiar políticas globales de cifrado (PBKDF2, etc.).   |

### ETL

| Capability            | Descripción                                                      |
|-----------------------|------------------------------------------------------------------|
| ETL_VIEW              | Ver ETL Studio (Designer y Runner).                             |
| ETL_EDIT_PRESETS      | Crear/editar/eliminar presets y Record Types.                   |
| ETL_RUN               | Ejecutar procesos ETL (Runner, Web Workers).                    |
| ETL_CONFIG_GLOBAL     | Cambiar configuración global ETL (paths, encoding, límites).    |

### LETTER

| Capability              | Descripción                                                       |
|-------------------------|-------------------------------------------------------------------|
| LETTER_VIEW             | Ver plantillas, mappings y estado de LETTER STATION.             |
| LETTER_EDIT_TEMPLATES   | Crear/editar/eliminar plantillas de carta.                       |
| LETTER_EDIT_MAPPINGS    | Crear/editar mappings ETL → plantilla.                           |
| LETTER_GENERATE         | Lanzar generación masiva de cartas (PDF/ZIP) con GAWEB.          |
| LETTER_CONFIG_GLOBAL    | Cambiar parámetros globales de LETTER/GAWEB.                     |

### AUDIT

| Capability       | Descripción                                                   |
|------------------|---------------------------------------------------------------|
| AUDIT_VIEW       | Ver System Audit y logs de `audithistoryv6`.                 |
| AUDIT_RUN        | Lanzar auditorías (paquetes, GAWEB, integridad, etc.).       |
| AUDIT_CONFIG     | Cambiar políticas/umbrales de auditoría.                     |

### SUPERVISOR / SEGURIDAD / SETTINGS

| Capability         | Descripción                                                  |
|--------------------|--------------------------------------------------------------|
| SUPERVISOR_VIEW    | Ver Supervisor (telemetría, unidades, paneles).             |
| OPERATORS_MANAGE   | Gestionar operadores, roles, estados y rol maestro.         |
| SETTINGS_GLOBAL    | Cambiar configuración global de la suite (i18n, paths, etc.). |


## Matriz de permisos por rol

### ADMIN

- CRYPT: `CRYPT_USE`, `CRYPT_CONFIG_GLOBAL`
- ETL: `ETL_VIEW`, `ETL_EDIT_PRESETS`, `ETL_RUN`, `ETL_CONFIG_GLOBAL`
- LETTER: `LETTER_VIEW`, `LETTER_EDIT_TEMPLATES`, `LETTER_EDIT_MAPPINGS`, `LETTER_GENERATE`, `LETTER_CONFIG_GLOBAL`
- AUDIT: `AUDIT_VIEW`, `AUDIT_RUN`, `AUDIT_CONFIG`
- SUPERVISOR / SETTINGS: `SUPERVISOR_VIEW`, `OPERATORS_MANAGE`, `SETTINGS_GLOBAL`

### TECH

- CRYPT: `CRYPT_USE`
- ETL: `ETL_VIEW`, `ETL_EDIT_PRESETS`, `ETL_RUN`
- LETTER: `LETTER_VIEW`, `LETTER_EDIT_TEMPLATES`, `LETTER_EDIT_MAPPINGS`, `LETTER_GENERATE`
- AUDIT: `AUDIT_VIEW`, `AUDIT_RUN`, `AUDIT_CONFIG`
- SUPERVISOR: `SUPERVISOR_VIEW`
- Sin: `OPERATORS_MANAGE`, `SETTINGS_GLOBAL`, `CRYPT_CONFIG_GLOBAL`, `ETL_CONFIG_GLOBAL`, `LETTER_CONFIG_GLOBAL`

### OPERATOR

- CRYPT: `CRYPT_USE`
- ETL: `ETL_VIEW`, `ETL_RUN`
- LETTER: `LETTER_VIEW`, `LETTER_GENERATE`
- AUDIT: `AUDIT_VIEW`, `AUDIT_RUN`
- Sin acceso a: configuración global, diseño de modelos/plantillas/mappings, Supervisor (salvo que se añadan capacidades adicionales en el futuro).


## Convenciones de uso en código

- `useWorkspace().can('CAPABILITY')` se usa en:
  - Sidebar para mostrar/ocultar módulos.
  - Páginas (`/crypt`, `/etl`, `/letter`, `/audit`, `/supervisor`) para bloquear entrada.
  - Botones de acción (RUN, SAVE, CONFIG) y campos editable/readonly.
- La matriz se define en `lib/services/permissions.ts` como:

```ts
export type Capability = /* ...lista descrita arriba... */;
export type OperatorRole = 'ADMIN' | 'TECH' | 'OPERATOR';

const ROLE_CAPABILITIES: Record<OperatorRole, Capability[]> = { /* ... */ };

export const hasCapability = (role: OperatorRole | null | undefined, cap: Capability) =>
  !!role && ROLE_CAPABILITIES[role]?.includes(cap);
```
