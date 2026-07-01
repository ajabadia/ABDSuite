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
          hint={locale === 'es'
            ? 'Inicie sesión con sus credenciales federadas de ABDAuth'
            : 'Sign in utilizing your federated credentials from ABDAuth'}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="System Capabilities">
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Almacenamiento Seguro' : 'Secure Storage'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Aislamiento físico multitenant y carga integrada con proveedores de almacenamiento como Cloudinary.'
                : 'Physical multi-tenant isolation and integrated upload with storage providers such as Cloudinary.'}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Versionado Inmutable' : 'Immutable Versioning'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Historial de versiones append-only protegido contra sobrescritura o destrucción accidental.'
                : 'Append-only version history protected against accidental overwrites or destruction.'}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Retención y Auditoría' : 'Retention & Audit'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Trazabilidad bancaria de eventos a ABDLogs y ciclo de vida automatizado con purga controlada.'
                : 'Bank-grade event traceability to ABDLogs and automated lifecycle with controlled purging.'}
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
