# ✅ Style Audit & Consolidation Report: ABD Suite

> **Status: ✅ COMPLETED** — All phases of the consolidation plan have been executed. This document now serves as a **reference architecture** for the centralized styling system.

---

## 📐 Current Architecture: Single Source of Truth (SSOT)

The styling system is now fully centralized around `@abd/styles`. A single change in the core propagates to all applications without manual repetition.

---

## 📦 The Core: `industrial-core.css`

**Location:** `ABDStyles/src/styles/industrial-core.css` → built to `ABDStyles/dist/styles/industrial-core.css`

### 1. @theme inline — Design Tokens

Defines all CSS custom properties used across the suite via Tailwind v4's `@theme` directive.

### 2. CSS Custom Properties (Dark & Light Modes)

**Dark mode (default)** — "Aseptic Deep Black" palette
**Light mode** — "Industrial Grey/White"

### 3. @layer base — Global Resets & Typography

body: font-size 15px, line-height 1.6
h1-h6: font-weight 500, letter-spacing -0.025em

### 4. @utility Classes

bg-industrial-grid, mask-industrial-fade, glass-panel, bg-grain, animate-console-pulse

### 5. Standardized Console Components

btn-primary-console, btn-secondary-console, btn-destructive-console, btn-skip-console, input-console, console-breadcrumb, console-status-dot

---

## 🔗 Import Map

All 4 apps import via: `@abd/styles/dist/styles/industrial-core.css`

### App globals.css (Stripped Down)

| App | Contents |
|---|---|
| ABDAuth | @import "tailwindcss" |
| ABDLogs | @import "tailwindcss" + tw-animate-css |
| ABDQuiz | @import "tailwindcss" + tw-animate-css + @custom-variant dark |
| ABDtenantGobernance | @import "tailwindcss" |

---

## ⚙️ JS/TS Engine — Dynamic Multi-Tenant Branding

Functions: generateTenantCss, hexToHslComponents, getContrastColor (YIQ), adjustColor

---

## 🧩 Shared React Components

ThemeScript, AdminPageHeader, TacticalSidebar, Footer, HeroHeader

---

## 🧹 What Was Eliminated

| Before | After |
|---|---|
| @theme inline in 4 globals.css | Single source in industrial-core.css |
| body font-size duplicated | @layer base in industrial-core.css |
| Custom btn-skip-console with --color-saltar | Standardized in industrial-core.css |
| Mixed relative/alias imports | Unified @abd/styles/dist import |

---

## 🛠️ Maintenance Guide

1. Edit `ABDStyles/src/styles/industrial-core.css`
2. Run `cd ABDStyles && pnpm build`
3. Change propagates to all apps

---

## 📚 Related Documentation

ABDStyles/README.md, ABDStyles/docs/TECHNICAL.md, ABDStyles/docs/FUNCTIONAL.md, ABDStyles/docs/LESSONS_LEARNED.md

---

## 📊 Key Metrics

- 1 CSS file → 4+ apps
- 4x @theme inline eliminated
- 2x @layer base body eliminated
- 1x custom button class centralized
- 4/4 apps using unified import
