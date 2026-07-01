/**
 * @purpose Renderiza el layout para una página localizada específica en ABDAnalytics, incluyendo navegación, marca y componentes de análisis.
 * @purpose_en Renders the layout for a locale-specific page in ABDAnalytics, including navigation, branding, and analytics components.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:8,sig:1wiy3yr
 * @lastUpdated 2026-06-30T05:48:50.628Z
 */

import { getMessages } from "next-intl/server";
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { resolveTenantBranding } from "@ajabadia/satellite-sdk";
import { AppShellLayout } from "@ajabadia/ecosystem-widgets";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";
import { AnalyticsCommandPalette } from "@/components/layout/AnalyticsCommandPalette";

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
      commandPalette={<AnalyticsCommandPalette />}
    >
      {children}
    </AppShellLayout>
  );
}
