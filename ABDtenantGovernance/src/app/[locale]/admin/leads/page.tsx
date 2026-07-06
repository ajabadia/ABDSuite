import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { getTranslations } from 'next-intl/server';
import { UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AdminPageHeader } from '@ajabadia/styles';
import { getPendingRequestsAction } from '@/actions/leads-actions';
import { LeadsTable } from './LeadsTable';

export const revalidate = 0;

export default async function AdminLeadsPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ tenantId?: string; contextId?: string; contextType?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sParams = await searchParams;
  const tAdmin = await getTranslations('adminPortal');

  await ensureIndustrialAccess('SUPER_ADMIN');

  const queryStr = Object.entries(sParams)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const querySuffix = queryStr ? `?${queryStr}` : '';

  const requests = await getPendingRequestsAction();

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <AdminPageHeader
          icon={UserPlus}
          breadcrumb={<>{tAdmin('gobernanza')} &bull; {tAdmin('leadsTitle')}</>}
          title={tAdmin('leadsTitle')}
          backButton={
            <Link
              href={`/${locale}/admin${querySuffix}`}
              className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
              aria-label={tAdmin('btnBack')}
              title={tAdmin('btnBack')}
            >
              <ArrowLeft size={14} aria-hidden="true" />
            </Link>
          }
          description={tAdmin('leadsDesc')}
        />
        <LeadsTable requests={requests} />
      </div>
    </main>
  );
}
