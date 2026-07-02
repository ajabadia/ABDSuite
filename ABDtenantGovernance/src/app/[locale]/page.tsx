/**
 * @purpose Renders the home page for the ABDtenantGovernance application, including a hero header, login button, and system capabilities section.
 * @purpose_en Renders the home page for the ABDtenantGovernance application, including a hero header, login button, and system capabilities section.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:bam2hu
 * @lastUpdated 2026-06-30T11:18:21.969Z
 */

import { getTranslations } from 'next-intl/server';
import { ArrowRight, ShieldCheck, Palette, Layers } from 'lucide-react';
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
          <>{h('abdTitle')} <span className="text-primary">{'Governance'}</span></>
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
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('hotWhitelabeling')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('hotWhitelabelingDesc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('spaceHierarchies')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('spaceHierarchiesDesc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {h('cryptographicSecurity')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h('cryptographicSecurityDesc')}
            </p>
          </div>

        </div>
      </main>

      <GlobalFooter
        separatorWidth="short"
        telemetryItems={[
          { label: h('footerLabelControlPlane'), value: h('version') },
          { label: h('footerLabelStyle'), value: h('style') }
        ]}
      />
    </LandingPageLayout>
  );
}
