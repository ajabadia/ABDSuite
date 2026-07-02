/**
 * @purpose Renderiza una página para editar la configuración de un examen en la aplicación ABDQuiz, incluyendo manejo de formularios y navegación.
 * @purpose_en Renders a page for editing an exam configuration in the ABDQuiz application, including form handling and navigation.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:16,sig:qzbdnq
 * @lastUpdated 2026-06-26T10:02:15.256Z
 */

import { getTranslations } from 'next-intl/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { withTenantContext } from '@ajabadia/satellite-sdk/db';
import { resolveTargetTenantContext } from '@ajabadia/satellite-sdk/utils';
import { resolveTenantContext } from '@/lib/tenant-context';
import ExamConfigForm from '@/components/admin/ExamConfigForm';
import ExamConfig from '@/models/ExamConfig';
import { ExamAuditorService, ExamAuditReport } from '@/services/quiz/ExamAuditorService';
import { notFound } from 'next/navigation';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { AdminPageHeader } from '@ajabadia/styles';
import ExamAuditSection from '@/components/admin/ExamAuditSection';
import ExamCourseLink from '@/components/admin/ExamCourseLink';
import Course from '@/models/Course';

export default async function EditExamPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string, id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations('admin');
  const user = await ensureIndustrialAccess('ADMIN');
  const resolvedTenantId = await resolveTenantContext(searchParams);
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const tenantSuffix = isSuperAdmin ? `?tenantId=${resolvedTenantId}` : '';

  // ── Multi-tenant awareness ─────────────────────────────────────────────
  const explicitCtx = await resolveTargetTenantContext(resolvedTenantId);
  const { config, auditReport, courses } = await withTenantContext(async () => {
    await connectDB();
    const cfg = await ExamConfig.findById(id).lean();
    let reportData: ExamAuditReport | null = null;
    let courseList: { _id: string; name: string }[] = [];
    if (cfg) {
      const report = await ExamAuditorService.auditExamCoverage(resolvedTenantId, id);
      if (report) reportData = JSON.parse(JSON.stringify(report)) as ExamAuditReport;
      const courseDocs = await Course.find({ tenantId: resolvedTenantId, active: true })
        .select('name')
        .sort({ name: 1 })
        .lean();
      courseList = courseDocs.map((c) => ({ _id: (c._id as { toString(): string }).toString(), name: c.name as string }));
    }
    return { config: cfg, auditReport: reportData, courses: courseList };
  }, explicitCtx);

  if (!config || (config.tenantId !== user.tenantId && !isSuperAdmin)) {
    return notFound();
  }

  const serializedConfig = JSON.parse(JSON.stringify(config));
  const courseId = config.courseId?.toString();

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Header Navigation */}
        <AdminPageHeader
          icon={FolderOpen}
          breadcrumb={<>CONSOLA DE CONTROL • {t('edit')} {t('examConfig')}</>}
          title={<>{t('edit')} {t('examConfig')}</>}
          backButton={
              <Link 
                href={`/${locale}/admin/exams${tenantSuffix}`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Volver a exámenes"
                title="Volver a exámenes"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
          }
          description={<>{config.name} | ID: <span className="text-primary font-bold">{id.slice(-8)}</span></>}
        />

        <ExamConfigForm initialData={serializedConfig} locale={locale} tenantId={resolvedTenantId} />

        <ExamCourseLink
          examConfigId={id}
          currentCourseId={courseId}
          courses={courses}
        />

        <ExamAuditSection
          report={auditReport}
          examName={config.name}
          courseId={courseId}
          locale={locale}
          tenantSuffix={isSuperAdmin ? `?tenantId=${resolvedTenantId}` : ''}
        />
      </div>
    </main>
  );
}
