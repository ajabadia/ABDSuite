# `@ajabadia/styles` — Industrial Styling Gateway

Centralized multi-tenant dynamic styling engine and common visual tokens for the entire **ABD SaaS Suite** (`ABDAuth`, `ABDQuiz`, `ABDGovernance`, `ABDDocumentation`, `ABDCompliance`). 

Utilizes **TypeScript**, **Zod**, and **Tailwind CSS v4** to render highly customizable corporate styles at Next.js Server Component (SSR) level with **0ms latency** and zero layout flashing.

Now also serves as the single provider for:
*   **Unified Stylesheet**: Consolidated visual parameters and console utility classes (`dist/styles/industrial-core.css`).
*   **Agnostic UI Components**: Reusable, framework-agnostic React components (`AdminPageHeader`, `Footer`, `HeroHeader`, `TacticalSidebar`, `ThemeScript`) that eliminate interface divergence across applications.

---

## 🛠️ Quickstart

### 1. Installation
To install `@ajabadia/styles` in any sibling repository across Vercel, reference the Git repository directly in your `package.json`:
```json
{
  "dependencies": {
    "@ajabadia/styles": "git+https://github.com/ajabadia/ABDStyles.git#main"
  }
}
```

### 2. Local Setup and Compilation
To set up, install dependencies, and build the distribution ESM files inside this repository:
```bash
npm install
npm run build
```

### 3. Run Quality Audits
To execute the strict 4-phase quality verification pipeline and confirm ERA 11 compliance:
```powershell
powershell ./scripts/abd-audit.ps1
```

---

## 📚 Core Documentation

To avoid redundant specifications, refer directly to our dedicated guides:
*   **[TECHNICAL.md](file:///d:/desarrollos/ABDStyles/docs/TECHNICAL.md)**: Color space formulas (YIQ contrast & bitwise shifts), Tailwind v4 space-separated HSL component mappings, Next.js Server-Side layout rendering integration, and dependency references.
*   **[FUNCTIONAL.md](file:///d:/desarrollos/ABDStyles/docs/FUNCTIONAL.md)**: Specifications for the Dynamic Branding customizer UI panel, secure logo uploads to Vercel Blob Storage, multi-tenant subdomain resolution, local testing with `lvh.me`, and favicon cache-busting logic.
*   **[LESSONS_LEARNED.md](file:///d:/desarrollos/ABDStyles/docs/LESSONS_LEARNED.md)**: Architectural lessons learned, including resolving CommonJS conflicts under strict verbatimModuleSyntax.
