/**
 * @purpose Renderiza la página de dashboard para la aplicación de satélite base, incluyendo guardia de autenticación, navegación y componentes de interfaz de usuario.
 * @purpose_en Renders the dashboard page for the base satellite application, including authentication guard, navigation, and UI components.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:1xhotn3
 * @lastUpdated 2026-06-21T08:41:25.337Z
 */

import { getTranslations } from 'next-intl/server';
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { redirect } from 'next/navigation';
import { ArrowLeft, Layout } from 'lucide-react';
import Link from 'next/link';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('common');
  const h = await getTranslations('home');

  // 🛡️ Auth guard — must be authenticated
  const session = await getIndustrialSession();
  if (!session?.user?.id) {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      {/* Tactical grid background */}
      <div className="absolute inset-0 bg-industrial-grid mask-industrial-fade pointer-events-none opacity-50" aria-hidden="true" />

      <div className="max-w-7xl mx-auto flex flex-col gap-10 z-10 relative">

        {/* Back navigation */}
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
            aria-label="Back to landing"
            title="Back to Landing"
          >
            <ArrowLeft size={14} aria-hidden="true" />
          </Link>
        </div>

        {/* Generic Dashboard UI */}
        <div className="p-8 bg-card border border-border rounded-xl flex flex-col gap-6 font-mono text-xs">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
              {t('operationsCenter')}
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {t('dashboardDesc')}
          </p>
        </div>

        {/* Footer */}
        <GlobalFooter
          label={`${t('brandPart1') || 'ABD'}${t('brandPart2') || 'BASE'} ${h('version')}`}
          opacity={20}
        />
      </div>
    </main>
  );
}
