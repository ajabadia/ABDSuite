'use client';

/**
 * @purpose Gestiona la integración del componente UI de seleccionador de teniente con preocupaciones aplicativas específicas como la extracción de API, el manejo de cookies y la ruta de parámetros de URL.
 * @purpose_en Manages the integration of a tenant selector UI component with application-specific concerns such as API fetching, cookie management, and URL parameter routing.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:4,sig:of0ys2
 * @lastUpdated 2026-06-26T09:59:38.234Z
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { TenantSelector, type TenantOption, type ContextOption } from "../identity/TenantSelector.js";
import { useTenantMegaMenu } from "../identity/TenantMegaMenuContext.js";

// ---------------------------------------------------------------------------
// TenantSelectorConnector
// ---------------------------------------------------------------------------
// Thin connector that bridges @ajabadia/ecosystem-widgets' pure UI TenantSelector
// with app‑specific concerns: API fetching, cookie management, URL param routing.
//
// Usage (all clients):
//   <TenantSelectorConnector sessionUser={session.user} />
//
// Optional props:
//   enableContexts   – fetch & pass spaces/groups (default: false)
//   onTenantSwitch   – server action to call after cookie set (e.g. switchTenantAction)
//   useRouterPush    – use next/navigation router.push instead of window.location.href
//   systemTenantLabel– label when tenantId === 'SYSTEM'  (default: 'Sistema Global')
// ---------------------------------------------------------------------------

export interface TenantSelectorConnectorProps {
  sessionUser?: {
    id?: string;
    email?: string;
    role?: string;
    tenantId?: string;
  };
  /** Enable spaces/groups context support (needed by tenantGobernance) */
  enableContexts?: boolean;
  /** Optional server action to fire after setting cookie (e.g. switchTenantAction) */
  onTenantSwitch?: (tenantId: string) => Promise<unknown>;
  /** Use next/navigation router.push instead of window.location.href */
  useRouterPush?: boolean;
  /** Label for the SYSTEM tenant (default: 'Sistema Global') */
  systemTenantLabel?: string;
  /** Optional callback fired when onTenantSwitch (server action) throws */
  onError?: (error: unknown, context: { action: "tenantSwitch"; tenantId: string }) => void;
  /** Rendering variant when used inside SmartNavbar mega menu */
  variant?: 'dropdown' | 'trigger' | 'content';
  /** External open state control (used by SmartNavbar via cloneElement) */
  isOpen?: boolean;
}

export function TenantSelectorConnector({
  sessionUser,
  enableContexts = false,
  onTenantSwitch,
  useRouterPush = false,
  systemTenantLabel = "Sistema Global",
  onError,
  variant,
  isOpen,
}: TenantSelectorConnectorProps) {
  const searchParams = useSearchParams();
  const nextPathname = usePathname();
  const nextRouter = useRouter();
  const megaMenu = useTenantMegaMenu();

  // When used inside the SmartNavbar mega menu (via TenantMegaMenuProvider),
  // derive variant and isOpen from context instead of relying on React.cloneElement
  // (which breaks with server-to-client boundary elements in React 19).
  const effectiveVariant = variant ?? megaMenu?.variant;
  const effectiveIsOpen = isOpen ?? megaMenu?.isOpen;

  // ── State ──────────────────────────────────────────────────────────────
  const [superAdminTenants, setSuperAdminTenants] = useState<TenantOption[]>([]);
  const [spaces, setSpaces] = useState<ContextOption[]>([]);
  const [groups, setGroups] = useState<ContextOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────
  const userRole = sessionUser?.role || "USER";
  const defaultTenantId = sessionUser?.tenantId || "";
  const activeTenantId = searchParams.get("tenantId") || defaultTenantId;
  const activeContextId = searchParams.get("contextId") || "";

  // ── Tenants list ───────────────────────────────────────────────────────
  const tenants = useMemo<TenantOption[]>(() => {
    if (userRole !== "SUPER_ADMIN") {
      if (!defaultTenantId) return [];
      return [
        {
          tenantId: defaultTenantId,
          name:
            defaultTenantId === "SYSTEM"
              ? systemTenantLabel
              : `Org: ${defaultTenantId}`,
        },
      ];
    }
    return superAdminTenants;
  }, [userRole, defaultTenantId, superAdminTenants, systemTenantLabel]);

  // ── Fetch tenants (SUPER_ADMIN only) ───────────────────────────────────
  useEffect(() => {
    if (userRole !== "SUPER_ADMIN") return;

    const fetchAllTenants = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/tenants");
        if (res.ok) {
          const data = await res.json();
          const options: TenantOption[] = data.map(
            (t: { tenantId: string; name?: string; active?: boolean }) => ({
              tenantId: t.tenantId,
              name: t.name || t.tenantId,
              active: t.active,
            })
          );
          setSuperAdminTenants(options);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') { console.error("[TENANT_SELECTOR_FETCH_ERROR]", error); }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTenants();
  }, [userRole]);

  // ── Fetch contexts (spaces/groups) ─────────────────────────────────────
  useEffect(() => {
    if (!enableContexts || !activeTenantId) return;

    const fetchContexts = async () => {
      try {
        const [spacesRes, groupsRes] = await Promise.all([
          fetch(`/api/admin/spaces?tenantId=${activeTenantId}`),
          fetch(`/api/admin/permissions/groups?tenantId=${activeTenantId}`),
        ]);

        if (spacesRes.ok) {
          const resJson = await spacesRes.json();
          const items = Array.isArray(resJson)
            ? resJson
            : resJson.data || resJson.items || [];
          setSpaces(
            items.map(
              (s: { _id?: string; id?: string; name: string }) => ({
                id: s._id || s.id || "",
                name: s.name,
              })
            )
          );
        }
        if (groupsRes.ok) {
          const resJson = await groupsRes.json();
          const items = Array.isArray(resJson)
            ? resJson
            : resJson.data || resJson.items || [];
          setGroups(
            items.map(
              (g: { _id?: string; id?: string; name: string }) => ({
                id: g._id || g.id || "",
                name: g.name,
              })
            )
          );
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') { console.error("[TENANT_SELECTOR_CONTEXT_FETCH_ERROR]", error); }
      }
    };

    fetchContexts();
  }, [enableContexts, activeTenantId]);

  // ── Navigation ─────────────────────────────────────────────────────────
  const navigate = useCallback(
    (query: string) => {
      if (useRouterPush) {
        nextRouter.push(`${nextPathname}${query}`);
      } else {
        window.location.href = `${window.location.pathname}${query}`;
      }
    },
    [useRouterPush, nextPathname, nextRouter]
  );

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleTenantChange = useCallback(
    async (newTenantId: string) => {
      // 1. Set cookie
      document.cookie = `active_tenant_id=${newTenantId}; path=/; max-age=2592000; SameSite=Lax`;

      // 2. Optional server action
      if (onTenantSwitch) {
        try {
          await onTenantSwitch(newTenantId);
        } catch (err) {
          if (process.env.NODE_ENV === 'development') { console.error("[TENANT_SELECTOR_SWITCH_ERROR]", err); }
          onError?.(err, { action: "tenantSwitch", tenantId: newTenantId });
        }
      }

      // 3. Build query string preserving existing params
      const current = new URLSearchParams(window.location.search);
      current.set("tenantId", newTenantId);
      if (enableContexts) {
        current.delete("contextId");
        current.delete("contextType");
      }
      const query = current.toString() ? `?${current.toString()}` : "";
      navigate(query);
    },
    [onTenantSwitch, enableContexts, navigate]
  );

  const handleContextChange = useCallback(
    (newContextId: string, type: "space" | "group") => {
      const current = new URLSearchParams(window.location.search);
      current.set("contextId", newContextId);
      current.set("contextType", type);
      const query = current.toString() ? `?${current.toString()}` : "";
      navigate(query);
    },
    [navigate]
  );

  // ── Render ─────────────────────────────────────────────────────────────
  if (!sessionUser) return null;

  return (
    <TenantSelector
      activeTenantId={activeTenantId}
      tenants={tenants}
      onTenantChange={handleTenantChange}
      userRole={userRole}
      isLoading={isLoading}
      {...(effectiveVariant !== undefined ? { variant: effectiveVariant } : {})}
      {...(effectiveIsOpen !== undefined ? { isOpen: effectiveIsOpen } : {})}
      {...(enableContexts
        ? {
            spaces,
            groups,
            activeContextId,
            onContextChange: handleContextChange,
          }
        : {})}
    />
  );
}
