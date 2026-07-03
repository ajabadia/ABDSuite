# 🛡️ Grafo de Interrelaciones: ABDtenantGovernance (Control Plane)

Este documento representa el mapa de interrelaciones, dependencias y gobernanza del Control Plane centralizado del ecosistema, **ABDtenantGovernance**, formateado con enlaces bidireccionales (`[[WikiLinks]]`) para su exploración interactiva en **Obsidian**.

---

## 🏗️ Motor de Decisiones de Acceso (ABAC)

* [[src/services/guardian/guardian-engine.ts]]
	* Núcleo del evaluador de permisos dinámicos y condiciones ABAC.
	* Consulta las membresías de usuario en `[[src/lib/repositories/UserGroupMembershipRepository.ts]]`.
	* Resuelve delegaciones temporales activas mediante `[[src/lib/repositories/DelegatedRoleRepository.ts]]`.
	* Resuelve espacios jerárquicos permitidos consultando `[[src/services/tenant/space-service.ts]]`.
	* Recupera y contrasta las políticas efectivas de grupo usando `[[src/services/tenant/permission-service.ts]]`.
	* Expone el endpoint de evaluación remota S2S en `[[src/app/api/internal/guardian/evaluate/route.ts]]`.

* [[src/services/tenant/permission-service.ts]]
	* Implementa algoritmos de resolución BFS recursivos para herencia de políticas en grupos anidados.
	* Consume repositorios de datos:
		* `[[src/lib/repositories/PermissionGroupRepository.ts]]`
		* `[[src/lib/repositories/PermissionPolicyRepository.ts]]`

---

## 📂 Jerarquía de Espacios y Assets (Polimorfismo Many-to-Many)

* [[src/services/tenant/space-service.ts]]
	* Gestiona la creación de nodos espaciales y propagación de paths jerárquicos (`spacePath`).
	* Enlaza assets transversales mediante `[[src/services/tenant/asset-link-service.ts]]`.
	* Valida el aislamiento y la herencia de visibilidad (`props.propagates`).
	* Se vincula a modales UI de gestión en:
		* `[[src/components/admin/spaces/ManageSpaceCollaboratorsModal.tsx]]` (Gobernanza de permisos polimórficos de usuarios/grupos en espacios).
		* `[[src/components/admin/spaces/ManageSpaceAssetsModal.tsx]]` (Enlace interactivo de recursos documentales).

* [[src/services/tenant/asset-link-service.ts]]
	* Orquesta transacciones Many-to-Many utilizando `[[src/models/AssetSpaceLink.ts]]`.
	* Protege la soberanía de assets previniendo asignaciones cruzadas de tenant.

---

## 📦 Modelos y Repositorios (Mongoose & Capa de Acceso)

### Modelos de MongoDB
* [[src/models/Space.ts]] — Nodos de la estructura de carpetas/departamentos.
* [[src/models/Tenant.ts]] — Registro de licencias, dominios y branding.
* [[src/models/PermissionGroup.ts]] — Agrupaciones de usuarios con soporte de jerarquía.
* [[src/models/PermissionPolicy.ts]] — Reglas de acceso ABAC/RBAC (`effect`, `resources`, `actions`).
* [[src/models/AssetSpaceLink.ts]] — Enlaces Many-to-Many de assets a espacios.
* [[src/models/UserGroupMembership.ts]] — Relación intermedia usuario-grupo.
* [[src/models/DelegatedRole.ts]] — Delegación temporal de privilegios.

### Repositorios de Patrón DAO
* [[src/lib/repositories/SpaceRepository.ts]]
* [[src/lib/repositories/PermissionGroupRepository.ts]]
* [[src/lib/repositories/PermissionPolicyRepository.ts]]
* [[src/lib/repositories/AssetSpaceLinkRepository.ts]]

---

## 🎨 Interfaces de UI e Interacción

* [[src/components/admin/TenantBrandingForm.tsx]]
	* Formulario avanzado de personalización visual (HSL inputs y esquinas redondeadas con live-preview).
* [[src/components/layout/GovernanceCommandPalette.tsx]]
	* Atajo rápido `Ctrl+K` unificado para el salto reactivo entre contextos de tenants/espacios y vistas administrativas.
* [[src/components/ui/TenantSelector.tsx]]
	* Conector que delega la visualización del menú al componente unificado `[[ABDEcosystemWidgets|TenantSelector]]` de widgets.
* [[src/app/[locale]/logout-success/page.tsx]]
	* Renderiza la pantalla unificada de despedida delegando en el widget `[[ABDEcosystemWidgets|LogoutSuccessView]]`.

---

## 📚 Documentación de Especificaciones y Diseño

* **Especificaciones Activas**:
	* [[01_active_specs/ROADMAP.md]] (Hitos de desarrollo y plan multitenant).
* **Arquitectura**:
	* [[02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md]] (Políticas ABAC, diseño de GuardianEngine y aislamiento de datos).
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]] (Análisis de la arquitectura base del Control Plane).
* **Estructura Monorepo y Sincronización**:
	* [[.env.shared]] (Archivo central de variables de entorno comunes).
	* [[scripts/sync-env.ps1]] (Script de fusión inteligente de configuraciones locales).
	* [[scripts/sync-i18n.mjs]] (Script de sincronización de traducciones comunes).
* **Historial y Archivo**:
	* [[03_archive/PLAN_GOBERNANZA_ACCESOS_TENANTS.md]] (Plan original para el control de acceso y herencia de grupos).


