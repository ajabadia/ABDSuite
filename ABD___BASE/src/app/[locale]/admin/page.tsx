/**
 * @purpose Renderiza una página de panel administrativo con navegación, encabezado y detalles de sesión del usuario.
 * @purpose_en Renders an administrative dashboard page with navigation, header, and user session details.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:1wh3sum
 * @lastUpdated 2026-07-02T18:43:27.065Z
 */

import { getTranslations } from 'next-intl/server';
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import { AdminPageHeader } from '@ajabadia/styles';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';
import Link from 'next/link';

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('common');
  const session = await getIndustrialSession();

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Back to home */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('backToHome')}
        </Link>

        {/* Header Navigation */}
        <AdminPageHeader
          icon={LayoutDashboard}
          breadcrumb={<>{t('appTitle') || 'ABD Base'} • {t('dashboardBreadcrumb')}</>}
          title={<>{'ABD'} <span className="text-primary">{t('menuTitle')}</span></>}
          description={<>{t('controlPanelDescription')} <span className="text-primary font-bold">{session?.user?.tenantId || 'N/A'}</span>.</>}
        />

        {/* Generic Dashboard Panel */}
        <div className="z-10 w-full max-w-xl p-8 bg-card border border-border rounded-xl flex flex-col gap-6 font-mono text-xs mt-4">
          <div className="flex justify-between border-b border-border pb-4">
            <span className="uppercase text-muted-foreground">{t('appLabel')}</span>
            <span className="font-bold text-foreground">{t('appValue')}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase text-muted-foreground">{t('statusLabel')}</span>
            <span className="text-[#2dd4bf] font-black">[CONNECTED]</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase text-muted-foreground">{t('tenantActiveLabel')}</span>
            <span className="font-bold text-foreground">{session?.user?.tenantId || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase text-muted-foreground">{t('userLabel')}</span>
            <span className="font-bold text-foreground">{session?.user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase text-muted-foreground">{t('roleLabel')}</span>
            <span className="font-bold text-foreground">{session?.user?.role || 'N/A'}</span>
          </div>
        </div>

        <GlobalFooter label={t('panelVerified')} opacity={0.8} />

      </div>
    </main>
  );
}
