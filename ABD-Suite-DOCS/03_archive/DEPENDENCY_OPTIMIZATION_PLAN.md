?? Dependency Optimization & Security Hardening Plan

## ?? Overview
This document defines the roadmap for optimizing the dependencies across the ABD Suite. Following the strategic move to Better Auth, we now need to clean up technical noise and unify the dependency tree.

## ?? Primary Objectives
1. Security Upgrade: Transition from bcryptjs to argon2.
2. Dead Code Removal: Purge manual MFA and legacy Auth libraries.
3. Architecture Unification: Sync core utility versions.
4. Lean Core: Minimize external packages in ABDAuth.

## ?? Implementation Roadmap

### Phase 1: Security Baseline (High Priority)
- [ ] Upgrade Password Hashing: Uninstall bcryptjs -> Install argon2. Reset fake user hashes.
- [ ] Audit Secret Management: Ensure all keys are in .env.

### Phase 2: The Great Purge (Post-Better Auth)
- [ ] Remove Legacy Engine: npm uninstall next-auth.
- [ ] Delete Manual MFA Stack: npm uninstall otplib qrcode. Delete MfaService.ts.
- [ ] Clean up WebAuthn: npm uninstall @simplewebauthn/browser and @simplewebauthn/server.
- [ ] Purge Unused Types: Remove declare module next-auth.

### Phase 3: Dependency Unification
- [ ] Zod Sync: Ensure all apps use ^4.4.3.
- [ ] Tailwind Merge Sync: Update all to ^3.6.0.
- [ ] Lucide-React Sync: Fix all to ^1.16.0.
- [ ] Internal Refs: Replace github refs with file:../ refs.

### Phase 4: Final Polish
- [ ] Tree Shaking Check: Ensure no ghost deps in bundles.
- [ ] Peer Dep Validation: Verify React 19 / Next 16 compatibility.
- [ ] Lockfile Cleanup: commit a clean pnpm-lock.yaml.

## ?? Critical Notes
1. Fake User Advantage: Wipe auth collections in DB as needed.
2. Type Safety: No any/casting. Use Better Auth inferred types.
3. Order: Better Auth Migration -> bcryptjs removal -> MFA removal -> Version Sync.

## ? Definition of Done
- No next-auth, otplib, or bcryptjs in ABDAuth.
- Password hashing uses argon2.
- All apps share identical core versions (zod, lucide, tailwind-merge).
