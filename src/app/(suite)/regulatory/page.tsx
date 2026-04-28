'use client';

import React, { Suspense } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { TinValidatorStation } from '@/components/regulatory/TinValidatorStation';
import { ShieldCheckIcon, UserIcon, ListIcon, MapIcon, GlobeIcon } from '@/components/common/Icons';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';
import { StationHeader } from '@/components/shell/StationHeader';

function RegulatoryPageContent() {
  const { t } = useLanguage();
  const { can } = useWorkspace();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (!can('REGTECH_VIEW')) {
    return <ForbiddenPanel />;
  }

  const view = searchParams.get('view');
  const mode = (view === 'batch') ? 'batch' : 'one-by-one';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 24px' }}>
      <StationHeader 
        moduleName={t('shell.regtech')}
        engineId="REG_ORCHESTRATOR_V6"
        tabs={[
          { 
            id: 'one-by-one', 
            label: t('shell.regtech_one_by_one'), 
            icon: <UserIcon size={14} />, 
            active: mode === 'one-by-one',
            onClick: () => router.push('/regulatory?view=one-by-one')
          },
          { 
            id: 'batch', 
            label: t('shell.regtech_batch'), 
            icon: <ListIcon size={14} />, 
            active: mode === 'batch',
            onClick: () => router.push('/regulatory?view=batch')
          },
          {
            id: 'registry',
            label: t('shell.regtech_registry') || 'REGISTRO GLOBAL',
            icon: <GlobeIcon size={14} />,
            active: false,
            onClick: () => router.push('/regulatory/registry')
          }
        ]}
      />

      <section className="module-grid" style={{ flex: 1, minHeight: 0 }}>
        <div className="module-col-main" style={{ gridColumn: 'span 12' }}>
          <TinValidatorStation mode={mode} />
        </div>
      </section>
    </div>
  );
}

export default function RegulatoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegulatoryPageContent />
    </Suspense>
  );
}
