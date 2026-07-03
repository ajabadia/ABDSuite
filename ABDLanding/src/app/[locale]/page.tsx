/**
 * @purpose Renderiza una página de aterrizaje con varias aplicaciones suite y sus detalles, incluyendo análisis, autenticación, registros, archivos, quiz, gobernanza y archivo criptográfico.
 * @purpose_en Renders a landing page with various suite applications and their details, including analytics, authentication, logs, files, quiz, governance, and cryptfile.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:1k5k6fg
 * @lastUpdated 2026-07-02T18:46:05.657Z
 */

import { getTranslations } from 'next-intl/server';
import {
  BarChart3,
  KeyRound,
  ScrollText,
  BrainCircuit,
  Users,
  Lock,
  Globe,
  ArrowRight,
  ShieldCheck,
  Building2,
  FolderOpen,
} from 'lucide-react';
import { HeroHeader, LandingPageLayout, SubtleLoginButton } from '@ajabadia/styles';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';
import { StorageProviderBadge } from '@/components/ui/StorageProviderBadge';
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';

interface SuiteApp {
  id: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  status: string;
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'abdia.es';

const APP_URLS: Record<string, string> = {
  analytics: process.env.ANALYTICS_URL || `https://analytics.${ROOT_DOMAIN}`,
  auth:      process.env.AUTH_PROVIDER_URL || `https://auth.${ROOT_DOMAIN}`,
  logs:      process.env.LOGS_URL || `https://logs.${ROOT_DOMAIN}`,
  files:     process.env.FILES_URL || `https://files.${ROOT_DOMAIN}`,
  quiz:      process.env.QUIZ_URL || `https://quiz.${ROOT_DOMAIN}`,
  governance: process.env.GOVERNANCE_URL || `https://tenantgovernance.${ROOT_DOMAIN}`,
  cryptfile: `https://crypt.${ROOT_DOMAIN}`,
};

const getSuiteApps = (locale: string, tHome: (key: string, opts?: { [key: string]: string }) => string): SuiteApp[] => [
  {
    id: 'analytics',
    href: `${APP_URLS.analytics}/${locale}`,
    icon: BarChart3,
    name: 'ABD Analytics',
    description: tHome('analyticsDesc'),
    status: tHome('operational'),
  },
  {
    id: 'auth',
    href: `${APP_URLS.auth}/${locale}`,
    icon: KeyRound,
    name: 'ABD Auth',
    description: tHome('authDesc'),
    status: tHome('operational'),
  },
  {
    id: 'logs',
    href: `${APP_URLS.logs}/${locale}`,
    icon: ScrollText,
    name: 'ABD Logs',
    description: tHome('logsDesc'),
    status: tHome('operational'),
  },
  {
    id: 'files',
    href: `${APP_URLS.files}/${locale}`,
    icon: FolderOpen,
    name: 'ABD Files',
    description: tHome('filesDesc'),
    status: tHome('operational'),
  },
  {
    id: 'quiz',
    href: `${APP_URLS.quiz}/${locale}`,
    icon: BrainCircuit,
    name: 'ABD Quiz',
    description: tHome('quizDesc'),
    status: tHome('operational'),
  },
  {
    id: 'gobernanza',
    href: `${APP_URLS.governance}/${locale}`,
    icon: Users,
    name: tHome('governanceName'),
    description: tHome('governanceDesc'),
    status: tHome('operational'),
  },
  {
    id: 'cryptfile',
    href: `${APP_URLS.cryptfile}/${locale}`,
    icon: Lock,
    name: 'ABD CryptFile',
    description: tHome('cryptfileDesc'),
    status: tHome('operational'),
  },
];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const h = await getTranslations('home');

  const session = await getIndustrialSession();
  const allApps = getSuiteApps(locale, h);

  const isAuthenticated = session.authenticated && !!session.user;
  const user = session.user;

  const allowedApps = isAuthenticated && user
    ? allApps.filter(app => user.role === 'SUPER_ADMIN' || user.allowedApps?.includes(app.id))
    : [];

  return (
    <LandingPageLayout maxWidth="6xl">
      <HeroHeader
        statusText={h('status')}
        title={<>{'ABD'} <span className="text-primary">{'Suite'}</span></>}
        description={h('tagline')}
      />

      <main className="flex flex-col gap-16 w-full" id="servicios">
        {isAuthenticated && user ? (
          <>
            <section aria-label={h('yourAuthorizedApps')}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/60">
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary">
                    {h('accessGranted')}
                  </p>
                  <h2 className="text-lg font-black uppercase tracking-wider">
                    {h('welcomeUser', { name: user.name })}
                  </h2>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-secondary/10 border border-border/80 rounded-sm w-fit">
                  <Building2 className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
                      {h('organization')}
                    </span>
                    <span className="text-xs font-black text-foreground">{user.tenantId}</span>
                  </div>
                </div>
              </div>

              {allowedApps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {allowedApps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <a
                        key={app.id}
                        href={app.href}
                        className="group p-6 bg-card border border-border rounded-sm flex flex-col gap-4 hover:border-primary/60 hover:bg-card/80 transition-all duration-300 text-left"
                        aria-label={h('accessApp', { name: app.name })}
                      >
                        <div className="flex items-start justify-between">
                          <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-sm group-hover:border-primary/40 transition-colors">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-mono text-[8px] uppercase tracking-widest text-emerald-500/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            {app.status}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <h3 className="text-sm font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                            {app.name}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {app.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary/60 transition-colors mt-auto">
                          <Globe className="w-3 h-3" />
                          <span>{app.href}</span>
                          <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-card border border-destructive/20 text-center rounded-sm flex flex-col items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-destructive" />
                  <p className="text-sm font-bold">
                    {h('noAppsAllowed')}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    {h('noAppsDesc')}
                  </p>
                </div>
              )}
            </section>

            <StorageProviderBadge />
          </>
        ) : (
          <>
            <SubtleLoginButton
              href={`/${locale}/login`}
              label={h('signIn')}
              hint={h('federatedCredentials')}
            />

            <section aria-label={h('ecosystemFeatures')}>
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground mb-6">
                {h('ecosystemModules')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allApps.map((app) => {
                  const Icon = app.icon;
                  return (
                    <div
                      key={app.id}
                      className="p-6 bg-card border border-border rounded-sm flex flex-col gap-4 opacity-85 hover:opacity-100 hover:border-border/80 transition-all duration-300 text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-mono text-[8px] uppercase tracking-widest text-primary/80 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                          {h('available')}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                          {app.name}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {app.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40 mt-auto">
                        <Globe className="w-3 h-3" />
                        <span>{app.href}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <GlobalFooter
        separatorWidth="short"
        telemetryItems={[
          { label: 'Suite', value: h('version') },
          { label: h('styleLabel'), value: h('style') }
        ]}
      />
    </LandingPageLayout>
  );
}
