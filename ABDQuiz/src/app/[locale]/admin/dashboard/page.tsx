/**
 * @purpose Renderiza la página de dashboard administrativo con indicadores clave de rendimiento y datos relevantes.
 * @purpose_en Renders the admin dashboard page with key performance indicators (KPIs) and relevant data.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:12,sig:wtbp5l
 * @lastUpdated 2026-07-02T18:46:49.478Z
 */

import { getTranslations } from 'next-intl/server';
import { ensureAdminOrProfessor } from '@/lib/auth/ensureQuizAccess';
import { resolveTenantContext } from '@/lib/tenant-context';
import { getDashboardKPIsAction } from '@/actions/adminDashboard';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';
import { AdminPageHeader } from '@ajabadia/styles';
import { StorageProviderBadge } from '@/components/admin/storage-provider-badge';
import { Users, BookOpen, BarChart3, HardDrive, TrendingUp, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function KpiCard({ icon: Icon, label, value, sublabel, accent }: { icon: React.ElementType; label: string; value: string; sublabel?: string; accent?: string }) {
  return (
    <Card className={`p-6 bg-card/30 border-border rounded-none flex flex-col gap-4 ${accent ? `border-l-4 border-l-${accent}` : ''}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold font-mono text-foreground tracking-tight">{value}</span>
        {sublabel && <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{sublabel}</span>}
      </div>
    </Card>
  );
}

export default async function AdminDashboardPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('common');
  const ap = await getTranslations('adminPortal');

  const user = await ensureAdminOrProfessor();
  const resolvedTenantId = await resolveTenantContext(searchParams);

  const kpis = await getDashboardKPIsAction(resolvedTenantId);

  const storagePercent = kpis.storageQuotaMB > 0 ? Math.min(100, Math.round((kpis.storageUsedMB / kpis.storageQuotaMB) * 100)) : 0;

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">

        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('backToAdmin')}
        </Link>

        <AdminPageHeader
          icon={TrendingUp}
          breadcrumb={<>{t('appTitle')} • {t('dashboardBreadcrumbBilling')}</>}
          title={<>{t('appTitle')} <span className="text-primary">{t('dashboardTitle')}</span></>}
          description={<>{t('dashboardDesc')}<span className="text-primary font-bold"> {resolvedTenantId}</span></>}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            icon={Users}
            label={t('totalStudents')}
            value={kpis.totalStudents.toString()}
            sublabel={t('activeUsers')}
          />
          <KpiCard
            icon={BookOpen}
            label={t('examsTaken')}
            value={kpis.totalExams.toString()}
            sublabel={t('fullHistory')}
          />
          <KpiCard
            icon={BarChart3}
            label={t('activeCourses')}
            value={kpis.activeCourses.toString()}
            sublabel={t('published')}
          />
          <KpiCard
            icon={DollarSign}
            label={t('lastInvoice')}
            value={`${kpis.lastInvoiceAmount.toFixed(2)} €`}
            sublabel={kpis.pendingInvoices > 0 ? `${kpis.pendingInvoices} ${t('pendingInvoices')}` : t('upToDate')}
          />
        </div>

        <StorageProviderBadge />

        <Card className="p-8 bg-card/30 border-border rounded-none">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-foreground flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" />
                {t('storage')}
              </h2>
              <span className="font-mono text-[10px] text-muted-foreground">
                {kpis.storageUsedMB.toFixed(1)} MB / {kpis.storageQuotaMB} MB
              </span>
            </div>
            <div className="w-full h-3 bg-white/5 border border-border rounded-none overflow-hidden">
              <style>{`.storage-fill { width: ${storagePercent}% }`}</style>
              <div className="storage-fill h-full bg-primary transition-all duration-500" />
            </div>
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
              {storagePercent}% {t('storageUsed')}
            </span>
          </div>
        </Card>

        <Card className="p-8 bg-card/30 border-border rounded-none">
          <div className="flex flex-col gap-6">
            <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t('examsPerMonth')}
            </h2>
            <Separator className="bg-border" />
            {kpis.examsPerMonth.length === 0 ? (
              <p className="text-[10px] font-mono text-muted-foreground">
                {t('noExamData')}
              </p>
            ) : (
              <div className="flex items-end gap-3 h-32">
                {kpis.examsPerMonth.map((entry) => {
                  const maxCount = Math.max(...kpis.examsPerMonth.map(e => e.count), 1);
                  const height = (entry.count / maxCount) * 100;
                  return (
                    <div key={`${entry.year}-${entry.month}`} className="flex flex-col items-center gap-1 flex-1">
                      <span className="font-mono text-[8px] text-muted-foreground">{entry.count}</span>
                  <style>{`.bar-fill { height: ${height}%; min-height: 4px }`}</style>
                  <div
                    className="bar-fill bg-primary"
                  />
                      <span className="font-mono text-[7px] text-muted-foreground uppercase">
                        {new Date(entry.year, entry.month - 1).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-8 bg-card/30 border-border rounded-none">
          <div className="flex flex-col gap-6">
            <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              {t('billingStatus')}
            </h2>
            <Separator className="bg-border" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-border">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t('pending')}
                  </span>
                  <span className="text-xl font-bold font-mono text-yellow-400">{kpis.pendingInvoices}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-border">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t('overdue')}
                  </span>
                  <span className="text-xl font-bold font-mono text-red-400">{kpis.overdueInvoices}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-border">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t('lastAmount')}
                  </span>
                  <span className="text-xl font-bold font-mono text-green-400">{kpis.lastInvoiceAmount.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <GlobalFooter label={`${t('appTitle')} BILLING`} opacity={20} />
      </div>
    </main>
  );
}
