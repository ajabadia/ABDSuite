/**
 * @purpose Renderiza la página principal del aplicativo ABDAnalytics, incluyendo un encabezado heroico, botón de inicio de sesión y secciones de capacidades del sistema.
 * @purpose_en Renders the home page of the ABDAnalytics application, including a hero header, login button, and system capabilities sections.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:ywc3gc
 * @lastUpdated 2026-06-30T11:18:11.906Z
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
          hint={locale === 'es'
            ? 'Inicie sesión con sus credenciales federadas de ABDAuth'
            : 'Sign in utilizing your federated credentials from ABDAuth'}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="System Capabilities">
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Capacitación y Desempeño' : 'Training & Performance'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Consolidación de curvas de aprendizaje, tasas de finalización, histogramas de Gauss y telemetría de distractores de ABDQuiz.'
                : 'Consolidation of learning curves, completion rates, Gauss grade distributions, and distractor telemetry from ABDQuiz.'}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Gobernanza y Recursos' : 'Governance & Resources'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Monitoreo de la utilización espacial de almacenamiento y activos de Spaces, junto al control y vigencia de licencias.'
                : 'Monitoring of spatial resource storage and assets usage in Spaces, alongside licensed application tracking.'}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Seguridad e Identidad' : 'Security & Identity'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Telemetría operacional de accesos en tiempo real, histórico de logins fallidos, y tasas de adopción de MFA/Passkeys en ABDAuth.'
                : 'Real-time operational access telemetry, timeline of failed logins, and MFA/Passkeys adoption rates from ABDAuth.'}
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
