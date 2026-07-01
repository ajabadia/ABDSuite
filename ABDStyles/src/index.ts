/**
 * @purpose Proporciona funcionalidades y componentes para estilizar una aplicación SaaS multitenante.
 * @purpose_en Exports utility functions and components for styling in a multi-tenant SaaS application.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:0,imports:0,sig:289xln
 * @lastUpdated 2026-06-30T05:49:43.711Z
 */

/**
 * @ajabadia/styles - Central Industrial Styling Library
 * 
 * Unified module exports providing mathematical color utilities, strict input validations,
 * and high-fidelity runtime HSL style generation for multi-tenant SaaS integration.
 */

export * from './utils/color-utils.js';
export * from './validation/branding-schema.js';
export * from './engine/css-generator.js';
export * from './components/ThemeScript.js';
export * from './components/AdminPageHeader.js';
export * from './components/HeroHeader.js';
export * from './components/RoleBadge.js';
export * from './components/LabeledField.js';
export * from './components/LandingPageLayout.js';
export * from './components/SubtleLoginButton.js';
