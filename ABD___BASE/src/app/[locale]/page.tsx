/**
 * @purpose Gestiona la página de inicio del aplicativo, maneja traducciones locales y autenticación de usuario.
 * @purpose_en Renders the home page of the application, handling locale-specific translations and user authentication.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:gjd3yp
 * @lastUpdated 2026-07-02T18:43:32.047Z
 */

import { getTranslations } from 'next-intl/server';
import { ArrowRight, Cpu, Layers, Shield } from 'lucide-react';
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
          <>{t('brandPart1')}<span className="text-primary">{t('brandPart2') || 'BASE'}</span></>
        }
        description={h('tagline')}
      />

      <main className="flex flex-col gap-16">
        <SubtleLoginButton
          href={`/${locale}/admin`}
          label={h('accessPanel')}
          hint={h('loginHint')}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="System Capabilities">
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('modularity')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('modularityDesc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('performance')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('performanceDesc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('security')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('securityDesc')}
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
