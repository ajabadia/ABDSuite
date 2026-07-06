/**
 * @purpose Renders a grid of action cards for the admin dashboard, each card representing different administrative actions or settings.

Se renderiza una grilla de tarjetas de acción para el panel administrativo, cada tarjeta representando diferentes acciones o configuraciones administrativas.
 * @purpose_en Renders a grid of action cards for the admin dashboard, each card representing different administrative actions or settings.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1xdh69q
 * @lastUpdated 2026-07-03T15:34:29.096Z
 */

import { Palette, Layers, Building2, ShieldCheck, Shield, ShoppingBag, GraduationCap, Cloud, Terminal, ShieldAlert } from 'lucide-react';
import { DashboardActionCard } from '@/components/admin/dashboard/DashboardActionCard';

interface DashboardCardsGridProps {
  locale: string;
  tenantQuery: string;
  adminT: (key: string) => string;
  portalT: (key: string) => string;
}

export function DashboardCardsGrid({ locale, tenantQuery, adminT, portalT }: DashboardCardsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-2">
      <DashboardActionCard
        icon={Building2}
        category={adminT('organizaciones')}
        title={adminT('tenantCardTitle')}
        description={adminT('tenantCardDesc')}
        footerLabel={adminT('multiTenancy')}
        footerValue={portalT('activo')}
        buttonText={adminT('tenantCardBtn')}
        href={`/${locale}/admin/tenants${tenantQuery}`}
      />
      <DashboardActionCard
        icon={Palette}
        category={adminT('visual')}
        title={adminT('brandCardTitle')}
        description={adminT('brandCardDesc')}
        footerLabel={adminT('yiqContrast')}
        footerValue={portalT('activo')}
        buttonText={adminT('brandCardBtn')}
        href={`/${locale}/admin/branding${tenantQuery}`}
      />
      <DashboardActionCard
        icon={Layers}
        category={adminT('estructura')}
        title={adminT('spaceCardTitle')}
        description={adminT('spaceCardDesc')}
        footerLabel={adminT('materializedPaths')}
        footerValue={portalT('activo')}
        buttonText={adminT('spaceCardBtn')}
        href={`/${locale}/admin/spaces${tenantQuery}`}
      />
      <DashboardActionCard
        icon={ShieldCheck}
        category={adminT('certification')}
        title={adminT('auditTitle')}
        description={adminT('auditDesc')}
        footerLabel={adminT('prodReady')}
        footerValue={portalT('activo')}
        buttonText={adminT('auditTitle')}
        href={`/${locale}/admin/audit${tenantQuery}`}
      />
      <DashboardActionCard
        icon={GraduationCap}
        category={adminT('quizRolesCategory')}
        title={adminT('quizRolesTitle')}
        description={adminT('quizRolesDesc')}
        footerLabel={adminT('quizRolesFooter')}
        footerValue={portalT('activo')}
        buttonText={adminT('quizRolesBtn')}
        href={`/${locale}/admin/quiz-roles${tenantQuery}`}
      />
      <DashboardActionCard
        icon={Shield}
        category={adminT('iamGovernance')}
        title={adminT('permissionsCardTitle')}
        description={adminT('permissionsCardDesc')}
        footerLabel={adminT('abacPolicies')}
        footerValue={portalT('activo')}
        buttonText={adminT('permissionsCardBtn')}
        href={`/${locale}/admin/permissions${tenantQuery}`}
      />
      <DashboardActionCard
        icon={ShoppingBag}
        category={adminT('marketplace.title')}
        title={adminT('marketplace.title')}
        description={adminT('marketplace.subtitle')}
        footerLabel={adminT('marketplace.title')}
        footerValue={portalT('activo')}
        buttonText={adminT('marketplace.title')}
        href={`/${locale}/admin/marketplace${tenantQuery}`}
      />
      <DashboardActionCard
        icon={Cloud}
        category={adminT('storageCategory')}
        title={adminT('storageProviderTitle')}
        description={adminT('storageProviderDesc')}
        footerLabel={adminT('persistenceEngines')}
        footerValue={portalT('activo')}
        buttonText={adminT('configureProviders')}
        href={`/${locale}/admin/connectors${tenantQuery}`}
      />
      <DashboardActionCard
        icon={Terminal}
        category={adminT('sandboxCategory')}
        title={adminT('sandboxTitle')}
        description={adminT('sandboxDesc')}
        footerLabel={adminT('debugMode')}
        footerValue={portalT('activo')}
        buttonText={adminT('openSandbox')}
        href={`/${locale}/admin/sandbox${tenantQuery}`}
      />
      <DashboardActionCard
        icon={ShieldAlert}
        category={adminT('gdprCategory')}
        title={adminT('gdprPortabilityTitle')}
        description={adminT('gdprPortabilityDesc')}
        footerLabel={adminT('compliance')}
        footerValue={portalT('activo')}
        buttonText={adminT('openGdprPanel')}
        href={`/${locale}/admin/gdpr${tenantQuery}`}
      />
    </div>
  );
}
