# 🏛️ Análisis de Arquitectura y Propuesta de Estandarización — ABD Suite

Este documento contiene el análisis técnico y las propuestas arquitectónicas iniciales para la suite de aplicaciones **ABD** (`ABDAuth`, `ABDQuiz`, `ABDtenantGobernance`, `ABDStyles`). El objetivo es unificar y estandarizar la suite bajo una infraestructura multi-tenant, federada y escalable.

---

## 📊 1. Estado Actual de las Aplicaciones

*   **`@ajabadia/styles` (`ABDStyles`)**:
    *   **Estado**: Estable y certificado (`SYS_CERTIFIED`).
    *   **Propósito**: Biblioteca centralizada de tokens visuales, utilidades matemáticas de color (conversión HSL compatible con Tailwind v4) y componentes comunes unificados de la interfaz de la suite (`SystemSettings`, `TacticalSidebar` y la paleta de comandos interactiva `CommandPalette`).
    *   **Distribución**: Se consume de forma centralizada a través del registro npm de GitHub bajo el scope `@ajabadia/`.
*   **`@ajabadia/satellite-sdk` (`ABDSatelliteSDK`)**:
    *   **Estado**: Estable y certificado (`SYS_CERTIFIED`).
    *   **Propósito**: Biblioteca npm centralizada para todas las aplicaciones satélite. Encapsula el middleware de Next.js (`proxy.ts`), la desencriptación criptográfica y validación de tokens JWT (`jose`), guardias cruzadas de dominios, prevención de bucles de login y la carga del CSS de branding sin parpadeos (Zero-FOUC).
    *   **Distribución**: Se consume de forma centralizada a través del registro npm de GitHub bajo el scope `@ajabadia/`.
*   **`ABDAuth`**:
    *   **Estado**: Proveedor de Identidad Centralizado (IdP) (`SYS_CERTIFIED_PROD`).
    *   **Propósito**: Puerta de enlace de identidad global. Gestiona credenciales de usuario, políticas de segundo factor (MFA), bloqueo progresivo de cuentas, rate limiting y el protocolo de inicio de sesión único federado (SSO/SLO) mediante intercambio de códigos temporales.
*   **`ABDtenantGobernance`**:
    *   **Estado**: Consola de Control de Tenants y Espacios (`SYS_CERTIFIED`).
    *   **Propósito**: Permite administrar organizaciones (Tenants), su branding personalizado, la estructura jerárquica de espacios físicos (sedes, edificios, salas) y almacena logs de auditoría asíncronos (*Fail-Safe*) en una base de datos remota dedicada.
*   **`ABDQuiz`**:
    *   **Estado**: Aplicación Satélite de Negocio (`SYS_CERTIFIED`).
    *   **Propósito**: Simulador de exámenes multi-tenant con lógica COW (Copy-On-Write) para versiones de preguntas, y soporte para tematización visual SSR sin parpadeos (*Zero-FOUC*).

---

## 🌐 2. Infraestructura de Red y Dominios (GoDaddy + Vercel)

Para unificar la suite bajo el dominio propio en GoDaddy y mantener los despliegues en Vercel, se optará por **enrutamiento basado en subdominios** en lugar de capas de enmascaramiento o proxies inversos.

### Configuración Recomendada de Subdominios:
1.  **Proveedor de Identidad**: `auth.tudominio.com` apuntando al proyecto `ABDAuth` en Vercel.
2.  **Consola de Administración**: `gobernanza.tudominio.com` apuntando al proyecto `ABDtenantGobernance` en Vercel.
3.  **Simulador**: `quiz.tudominio.com` apuntando al proyecto `ABDQuiz` en Vercel.

### Ventajas Técnicas:
*   **Seguridad**: Evita romper las políticas de navegador (CSP, Frame Ancestors y CORS) que surgen al usar iframes o enmascaramientos caseros.
*   **Transparencia**: Vercel provee certificados SSL automáticos y gestiona el enrutamiento. El usuario ve urls limpias bajo tu dominio raíz sin mención a Vercel.
*   **Multi-Tenancy por Subdominio (`*.quiz.tudominio.com`)**:
    *   En GoDaddy, se añade un registro **CNAME** con host `*.quiz` apuntando a `cname.vercel-dns.com`.
    *   En Vercel, se registra el dominio wildcard `*.quiz.tudominio.com` en el proyecto de `ABDQuiz`.
    *   El Middleware de Next.js lee la cabecera del host y extrae dinámicamente el tenant (ej. `academia1` de `academia1.quiz.tudominio.com`), aplicando su base de datos aislada y branding sin registrar dominios de forma manual.

### Compartición de Sesión:
*   **OAuth2 Redirect Flow**: Cada satélite guarda su propia cookie de sesión local (`abd_session`). Si el usuario no está logueado en el satélite, es redirigido a `auth.tudominio.com`. Si allí ya tiene sesión iniciada, el IdP valida al usuario y lo redirige de vuelta con un código en milisegundos de forma imperceptible.
*   **Wildcard Cookies**: Si se requiere que la cookie central de `ABDAuth` sea leída directamente por cualquier subdominio sin redirecciones, se puede añadir el atributo `Domain: '.tudominio.com'` en la definición de la cookie del IdP y satélites.

---

## 🚀 3. El Lanzador de Aplicaciones (Ecosystem Launcher)

El lanzador central de la suite debe ubicarse dentro de **`ABDAuth`** (en la ruta `/dashboard` o `/` tras el inicio de sesión).

### Razón de ser:
*   Es la puerta de entrada obligatoria del usuario.
*   Conoce el rol del usuario, el tenant actual al que está conectado y los privilegios de su cuenta.
*   Permite renderizar una cuadrícula (grid) técnica con los logos de las aplicaciones a las que tiene acceso (ej. ABDQuiz, ABDtenantGobernance). Al pulsar en una tarjeta, se le redirige al subdominio del satélite y se activa la sesión mediante el SSO silencioso.

---

## 🏛️ 4. Gobernanza del Ecosistema (Usuarios, Tenants y Logs)

Para que el ecosistema escale de forma limpia, mantendremos la separación estricta de responsabilidades:

1.  **Identidades y Autenticación (`ABDAuth`)**: Centraliza los registros de usuarios, contraseñas, políticas de MFA, intentos de acceso y sesiones activas globales.
2.  **Organizaciones y Espacios (`ABDtenantGobernance`)**: Centraliza la parametrización de Tenants (su branding, dbPrefix, estrategias de aislamiento) y la jerarquía física de espacios. `ABDAuth` solo lee esta base de datos en modo lectura para inyectar claims al autenticar.
3.  **Auditoría y Telemetría (`ABDLogs`)**:
    *   **Estado**: Desarrollado e integrado como microservicio centralizado.
    *   **Funcionamiento**: Expone un servicio REST con endpoints protegidos vía tokens secretos (`LOGS_SECRET_TOKEN`). Tanto `ABDAuth`, `ABDtenantGobernance` como el resto de satélites disparan eventos de auditoría y telemetría de forma asíncrona vía HTTP POST a este servicio, evitando la fatiga de conexiones concurrentes en base de datos bajo entornos Serverless (Vercel).

---

## 🔌 5. Distribución de Puertos en Desarrollo Local

Para evitar colisiones de red y establecer un orden jerárquico lógico durante el desarrollo en local, los puertos de escucha de la suite se dividen en dos rangos definidos:

### A. Servicios de Infraestructura Transversal (Rango 5000 - 5019)
Estos puertos alojan portales públicos, proveedores de identidad o consolas administrativas globales.

| Aplicación | Puerto Local | Propósito de Red |
| :--- | :--- | :--- |
| **`ABDLanding`** | **`5000`** | Portal público de entrada e landing page informativa. |
| **`ABDAuth`** | **`5001`** | Proveedor de identidad centralizado (IdP), SSO y SLO. |
| **`ABDtenantGobernance`** | **`5002`** | Consola de administración de Tenants, Espacios y Configuración. |
| **`ABDLogs`** | **`5003`** | Ingestión y consulta de logs de auditoría forense y telemetría. |
| **`ABDAnalytics`** | **`5004`** | Panel unificado de métricas e inteligencia de negocio de la suite. |
| **`ABDFiles`** | **`5005`** | Gestor documental y almacenamiento polimórfico. |

### B. Aplicaciones y Módulos de Usuario (Rango 5020 en adelante)
Este rango se reserva para las aplicaciones de negocio dirigidas al usuario final.

| Aplicación | Puerto Local | Propósito de Red |
| :--- | :--- | :--- |
| **`ABDQuiz`** | **`5020`** | Plataforma de aprendizaje y simulador de exámenes multi-tenant. |

---

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ROADMAP.md]]
	* [[01_active_specs/STYLE_GUIDE.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md]]
	* [[02_architecture/DISENO_SSO_TENANTS.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/Mapa_Global_Suite.md]]
	* [[grafos/ABDtenantGobernance.md]]
	* [[grafos/ABDAuth.md]]
	* [[grafos/ABDLogs.md]]
	* [[grafos/ABDFiles.md]]
	* [[grafos/ABDQuiz.md]]
	* [[grafos/ABDAnalytics.md]]
	* [[grafos/ABDLanding.md]]
	* [[grafos/ABDSatelliteSDK.md]]
	* [[grafos/ABDEcosystemWidgets.md]]
