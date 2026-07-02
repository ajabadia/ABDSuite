/**
 * @purpose Renderiza una página de panel administrativo con navegación, encabezado y detalles de sesión del usuario.
 * @purpose_en Renders an administrative dashboard page with navigation, header, and user session details.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:125lex1
 * @lastUpdated 2026-06-21T08:41:20.767Z
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
          {locale === 'es' ? 'Volver a Inicio' : 'Back to Home'}
        </Link>

        {/* Header Navigation */}
        <AdminPageHeader
          icon={LayoutDashboard}
          breadcrumb={<>{t('appTitle') || 'ABD Base'} • DASHBOARD</>}
          title={<>{'ABD'} <span className="text-primary">{locale === 'es' ? 'Panel de Control' : 'Control Panel'}</span></>}
          description={<>{locale === 'es' ? 'Consola de gobernanza y control operacional para ' : 'Governance and operational control console for '} <span className="text-primary font-bold">{session?.user?.tenantId || 'N/A'}</span>.</>}
        />

        {/* Generic Dashboard Panel */}
        <div className="z-10 w-full max-w-xl p-8 bg-card border border-border rounded-xl flex flex-col gap-6 font-mono text-xs mt-4">
          <div className="flex justify-between border-b border-border pb-4">
            <span className="uppercase text-muted-foreground">{locale === 'es' ? 'App:' : 'App:'}</span>
            <span className="font-bold text-foreground">{locale === 'es' ? 'ABD Satellite Base Panel' : 'ABD Satellite Base Panel'}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase text-muted-foreground">{locale === 'es' ? 'Estado:' : 'Status:'}</span>
            <span className="text-[#2dd4bf] font-black">[CONNECTED]</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase text-muted-foreground">{locale === 'es' ? 'Inquilino Activo:' : 'Tenant Active:'}</span>
            <span className="font-bold text-foreground">{session?.user?.tenantId || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase text-muted-foreground">{locale === 'es' ? 'Usuario:' : 'User:'}</span>
            <span className="font-bold text-foreground">{session?.user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase text-muted-foreground">{locale === 'es' ? 'Rol:' : 'Role:'}</span>
            <span className="font-bold text-foreground">{session?.user?.role || 'N/A'}</span>
          </div>
        </div>

        <GlobalFooter label={locale === 'es' ? 'Panel verificado' : 'Panel verified'} opacity={0.8} />

      </div>
    </main>
  );
}
