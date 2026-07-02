/**
 * @purpose Renderiza la página principal del aplicativo ABDAnalytics, incluyendo un encabezado heroico, botón de inicio de sesión y secciones de capacidades del sistema.
 * @purpose_en Renders the home page of the ABDAnalytics application, including a hero header, login button, and system capabilities sections.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:fco3nj
 * @lastUpdated 2026-07-02T18:43:39.932Z
 */

import { getTranslations } from 'next-intl/server';
import { ArrowRight, Cpu, Sliders, Database, ShieldCheck } from 'lucide-react';
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
          <>{'ABD'} <span className="text-primary">{'Analytics'}</span></>
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
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('trainingPerformance')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('trainingPerformanceDesc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('governanceResources')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('governanceResourcesDesc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('securityIdentity')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('securityIdentityDesc')}
            </p>
          </div>

        </div>
      </main>

      <GlobalFooter
        separatorWidth="short"
        telemetryItems={[
          { label: h('applicationLabel'), value: h('version') },
          { label: h('styleLabel'), value: h('style') }
        ]}
      />
    </LandingPageLayout>
  );
}
