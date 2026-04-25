'use client';

import React, { Suspense } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useSearchParams } from 'next/navigation';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { TinValidatorStation } from '@/components/regulatory/TinValidatorStation';
import { ShieldCheckIcon, UserIcon, ListIcon, MapIcon } from '@/components/common/Icons';
import { VaultStatusReactor } from '@/components/common/VaultStatusReactor';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';

function RegulatoryPageContent() {
  const { t } = useLanguage();
  const { can, isLocked } = useWorkspace();
  const searchParams = useSearchParams();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <header className="station-panel-header" style={{ padding: '0 0 20px 0' }}>
        <div className="flex-row" style={{ gap: '16px', alignItems: 'center' }}>
          <MapIcon size={24} style={{ opacity: 0.6 }} />
          <div className="flex-col" style={{ gap: '4px' }}>
            <h2 className="station-title-main" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              {mode === 'one-by-one' 
                ? t('shell.regtech_one_by_one').toUpperCase() 
                : t('shell.regtech_batch').toUpperCase()}
            </h2>
            <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
               <span style={{ opacity: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>ENGINE: REG_ORCHESTRATOR_V6</span>
               <span className="station-badge station-badge-blue">SECURE_CONTEXT</span>
               <span className={`station-badge ${isLocked ? 'station-badge-orange' : 'station-badge-green'}`}>
                  {isLocked ? 'VAULT_LOCKED' : 'VAULT_OPEN'}
               </span>
            </div>
          </div>
        </div>
      </header>

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
