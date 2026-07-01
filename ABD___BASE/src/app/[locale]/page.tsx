/**
 * @purpose Gestiona la página principal de la aplicación, maneja traducciones locales y autenticación del usuario.
 * @purpose_en Renders the home page of the application, handling locale-specific translations and user authentication.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:14vx8w3
 * @lastUpdated 2026-06-29T22:21:54.127Z
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
          label={locale === 'es' ? 'ACCEDER AL PANEL' : 'ACCESS CONTROL PLANE'}
          hint={locale === 'es'
            ? 'Inicie sesión con sus credenciales federadas de ABDAuth'
            : 'Sign in utilizing your federated credentials from ABDAuth'}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="System Capabilities">
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Modularidad' : 'Modularity'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Arquitectura desacoplada basada en componentes web industriales y micro-servicios.'
                : 'Decoupled architecture based on industrial web components and micro-services.'}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Rendimiento' : 'Performance'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Estructura optimizada sobre Next.js 16, React 19 y procesamiento asíncrono.'
                : 'Optimized structure over Next.js 16, React 19 and asynchronous processing.'}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Seguridad' : 'Security'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Control de acceso federado mediante JWT y aislamiento estricto multi-tenant.'
                : 'Federated access control utilizing JWT and strict multi-tenant isolation.'}
            </p>
          </div>
        </div>
      </main>

      <GlobalFooter
        separatorWidth="short"
        telemetryItems={[
          { label: locale === 'es' ? 'Aplicación' : 'Application', value: h('version') },
          { label: locale === 'es' ? 'Estilo' : 'Style', value: h('style') }
        ]}
      />
    </LandingPageLayout>
  );
}
