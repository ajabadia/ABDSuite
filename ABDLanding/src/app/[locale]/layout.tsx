/**
 * @purpose Renderiza el layout para la aplicación ABDLanding, incluyendo una navegación lateral, un menú de comandos y notificaciones emergentes.
 * @purpose_en Renders the layout for the ABDLanding application, including a sidebar navigation, command palette, and toaster notifications.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:8,sig:g80rz1
 * @lastUpdated 2026-06-30T05:49:24.385Z
 */

import { getMessages } from "next-intl/server";
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { resolveTenantBranding } from '@ajabadia/satellite-sdk/utils';
import { AppShellLayout } from "@ajabadia/ecosystem-widgets";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";
import { LandingCommandPalette } from "@/components/layout/LandingCommandPalette";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const session = await getIndustrialSession();
  const branding = await resolveTenantBranding();

  return (
    <AppShellLayout
      locale={locale}
      messages={messages}
      sidebarNavigation={
        <SidebarNavigation
          session={session}
          logoUrl={branding?.logoUrl}
          tenantSelectorSlot={session.authenticated ? <TenantSelector sessionUser={session?.user} /> : undefined}
          settingsSlot={<SystemSettings isAuthenticated={session.authenticated} />}
        />
      }
      commandPalette={<LandingCommandPalette />}
    >
      {children}
    </AppShellLayout>
  );
}
