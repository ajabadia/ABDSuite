/**
 * @purpose Renderiza la página principal del aplicativo ABDFiles, incluyendo un encabezado heroico, botón de inicio de sesión y secciones de capacidades del sistema.
 * @purpose_en Renders the home page of the ABDFiles application, including a hero header, login button, and system capabilities sections.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:pp194j
 * @lastUpdated 2026-06-30T11:18:17.705Z
 */

import { getTranslations } from 'next-intl/server';
import { ArrowRight, HardDrive, History, FileText } from 'lucide-react';
import { HeroHeader, LandingPageLayout, SubtleLoginButton } from '@ajabadia/styles';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { redirect } from 'next/navigation';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getIndustrialSession();

  if (session.authenticated && session.user) {
    redirect(`/${locale}/admin`);
  }

  const t = await getTranslations('common');
  const h = await getTranslations('home');

  return (
    <LandingPageLayout>
      <HeroHeader
        statusText={h('status')}
        title={
          <>{'ABD'} <span className="text-primary">{'Files'}</span></>
        }
        description={h('tagline')}
      />

      <main className="flex flex-col gap-16">
        <SubtleLoginButton
          href={`/${locale}/admin`}
          label={h('accessControlPlane')}
          hint={h('loginHint')}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="System Capabilities">
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('secureStorage')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('secureStorageDesc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('immutableVersioning')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('immutableVersioningDesc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('retentionAudit')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('retentionAuditDesc')}
            </p>
          </div>

        </div>
      </main>

      <GlobalFooter
        separatorWidth="short"
        telemetryItems={[
          { label: h('telemetryApp'), value: h('version') },
          { label: h('telemetryStyle'), value: h('style') }
        ]}
      />
    </LandingPageLayout>
  );
}
