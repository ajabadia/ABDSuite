/**
 * @purpose Renderiza el layout para una página localizada específicamente en la aplicación ABDSuite, incluyendo navegación, marca y componentes de interfaz de usuario.
 * @purpose_en Renders the layout for a locale-specific page in the ABDSuite application, including navigation, branding, and UI components.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:8,sig:18xseid
 * @lastUpdated 2026-06-30T05:48:46.167Z
 */

import { getMessages } from "next-intl/server";
import { BrandingStyles } from "@ajabadia/satellite-sdk/styles";
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { resolveTenantBranding } from "@ajabadia/satellite-sdk/utils";
import { AppShellLayout } from "@ajabadia/ecosystem-widgets";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";

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
      brandingStyles={<BrandingStyles />}
      sidebarNavigation={
        <SidebarNavigation
          session={session}
          logoUrl={branding?.logoUrl}
          tenantSelectorSlot={session.authenticated ? <TenantSelector sessionUser={session.user} /> : undefined}
          settingsSlot={<SystemSettings isAuthenticated={session.authenticated} />}
        />
      }
    >
      {children}
    </AppShellLayout>
  );
}

