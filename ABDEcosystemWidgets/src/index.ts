/**
 * @purpose Proporciona componentes, anclajes y utilidades para el ABDEcosystemWidgets.
 * @purpose_en Exports various components, hooks, and utilities for the ABDEcosystemWidgets application.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:0,imports:0,sig:188vycx
 * @lastUpdated 2026-06-30T05:49:05.513Z
 */

// Identidad
export * from './identity/TenantSelector.js';
export * from './identity/TenantMegaMenuContext.js';
export * from './identity/UserIdentity.js';
export * from './identity/LogoutSuccessView.js';

// Conectores
export * from './connectors/TenantSelectorConnector.js';
export * from './connectors/DefaultTenantSelector.js';

// Comandos
export * from './commands/commonCommands.js';

// Navegación
export * from './navigation/CommandPalette.js';
export * from './navigation/GlobalNavbar.js';
export * from './navigation/GlobalFooter.js';
export * from './navigation/IndustrialTopBar.js';
export * from './navigation/SmartNavbar.js';
export * from './navigation/AppSidebarNavigation.js';
export * from './navigation/AppShellLayout.js';
export * from './navigation/buildSidebarLinks.js';

// Hooks
export * from './hooks/useConfirmDialog.js';

// UI reutilizable
export * from './ui/ConfirmDialog.js';
export * from './ui/SelectSearch.js';
export * from './ui/IndustrialModalHeader.js';
export * from './ui/IndustrialSearchInput.js';
export * from './ui/dialog-elements.js';

// Shadcn-style primitives
export * from './ui/badge.js';
export * from './ui/button.js';
export * from './ui/card.js';
export * from './ui/dialog.js';
export * from './ui/input.js';
export * from './ui/label.js';
export * from './ui/progress.js';
export * from './ui/separator.js';

// Constantes compartidas
export * from './constants.js';

// Providers
export * from './providers/ThemeProvider.js';

// Configuración
export * from './settings/SystemSettings.js';

// Auditoría
export * from './audit/LiveLogViewer.js';
export * from './audit/AuditHistoryModal.js';
export * from './audit/AuditDeltaViewer.js';
export * from './audit/ActionBadge.js';
export * from './utils/featureFlags.js';
export * from './utils.js';
