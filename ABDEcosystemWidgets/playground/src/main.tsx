import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { SmartNavbar } from "../../src/navigation/SmartNavbar.tsx";
import type { GlobalNavbarSession, SidebarLink } from "../../src/navigation/GlobalNavbar.tsx";
import { Shield, LayoutDashboard, FileSearch, Settings } from "lucide-react";

// ═══════════════════════════════════════════
//  Mock Components (slots)
// ═══════════════════════════════════════════

function MockTenantSelector() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border border-border/40 font-mono text-[10px] text-foreground/70">
      <span className="text-primary">●</span>
      <span className="uppercase tracking-wider">TENANT_ACME</span>
      <span className="text-muted-foreground/40">▼</span>
    </div>
  );
}

function MockSystemSettings() {
  return (
    <div className="flex items-center gap-1">
      <button
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer rounded-none"
        title="Settings"
        data-testid="mock-settings-cog"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>
      <span className="font-mono text-[9px] text-muted-foreground/40 hidden lg:inline">ES</span>
    </div>
  );
}

// ═══════════════════════════════════════════
//  App Shell
// ═══════════════════════════════════════════

const links: SidebarLink[] = [
  { href: "/", label: "BIENVENIDA", icon: <Shield size={12} /> },
  { href: "/admin/audit", label: "AUDITORÍA", icon: <FileSearch size={12} /> },
  { href: "/admin", label: "CONSOLA", icon: <LayoutDashboard size={12} /> },
  { href: "/admin/settings", label: "AJUSTES", icon: <Settings size={12} /> },
];

const authenticatedSession: GlobalNavbarSession = {
  authenticated: true,
  user: {
    name: "Carlos Mendoza",
    role: "SUPER_ADMIN",
    tenantId: "ACME_CORP",
    email: "carlos.mendoza@acmecorp.com",
  },
};

const publicSession: GlobalNavbarSession = {
  authenticated: false,
};

// ═══════════════════════════════════════════
//  Playground Panel (toggle controls)
// ═══════════════════════════════════════════

function Playground() {
  const [mode, setMode] = useState<"authenticated" | "public">("authenticated");

  const session = mode === "authenticated" ? authenticatedSession : publicSession;

  return (
    <>
      {/* SmartNavbar */}
      <SmartNavbar
        session={session}
        links={links}
        logoUrl={null}
        brandName={session?.user?.tenantId}
        activeHref="/admin/audit"
        locale="es"
        onLogout={() => alert("Logout clicked!")}
        onLogin={() => alert("Login clicked!")}
        tenantSelectorSlot={mode === "authenticated" ? <MockTenantSelector /> : undefined}
        settingsSlot={<MockSystemSettings />}
        onSearchTrigger={() => alert("Search triggered (Ctrl+K)")}
        translations={{
          brandFallback: "ABD SYSTEM",
          searchLabel: "BUSCAR...",
          logoutBtn: "TERMINAR SESIÓN",
          loginBtn: "INICIAR SESIÓN",
        }}
      />

      {/* Page Content */}
      <main className="max-w-[1600px] mx-auto p-8 pt-8">
        <div className="border border-border/20 bg-muted/5 p-8">
          <h1 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground mb-2">
            SmartNavbar — Visual Playground
          </h1>
          <p className="font-mono text-[10px] text-muted-foreground/60 mb-6">
            Test hover mega-menus, Click-to-Lock, theme selector, user menu, and public/private mode.
          </p>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-8 p-4 border border-border/30 bg-background/50">
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Mode:
            </span>
            {(["authenticated", "public"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer rounded-none ${
                  mode === m
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border text-muted-foreground hover:text-primary hover:border-primary/30"
                }`}
              >
                {m === "authenticated" ? "🔐 Private" : "🌐 Public"}
              </button>
            ))}
          </div>

          {/* Mega-menu target zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Links", desc: "Hover over the center navigation links", zone: "center" },
              { title: "Theme", desc: "Hover over the sun/moon icon on the right", zone: "right" },
              { title: "User", desc: "Hover over the avatar with initials", zone: "right" },
              { title: "Search", desc: "Click the search button or Ctrl+K (simulated)", zone: "right" },
            ].map((card) => (
              <div
                key={card.title}
                className="border border-border/20 bg-muted/10 p-4"
              >
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">
                  {card.title}
                </h3>
                <p className="font-mono text-[9px] text-muted-foreground/60">
                  {card.desc}
                </p>
                <span className="inline-block mt-2 font-mono text-[8px] text-muted-foreground/30 uppercase tracking-wider">
                  {card.zone}
                </span>
              </div>
            ))}
          </div>

          {/* Debug info */}
          <div className="mt-8 p-4 border border-dashed border-border/20 bg-background/30">
            <pre className="font-mono text-[8px] text-muted-foreground/40">
              {JSON.stringify(
                {
                  mode,
                  authenticated: session.authenticated,
                  user: session.user
                    ? { name: session.user.name, role: session.user.role, tenantId: session.user.tenantId }
                    : null,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </main>
    </>
  );
}

// ═══════════════════════════════════════════
//  Mount
// ═══════════════════════════════════════════

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Playground />
    </React.StrictMode>
  );
}
