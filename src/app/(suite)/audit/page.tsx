'use client';

import React from 'react';
import AuditStation from '@/components/AuditStation/AuditStation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';
import { StationHeader } from '@/components/shell/StationHeader';

export default function AuditPage() {
  const { t } = useLanguage();
  const { can } = useWorkspace();

  if (!can('AUDIT_VIEW')) {
    return <ForbiddenPanel />;
  }

  return (
    <div className="flex-col animate-fade-in" style={{ height: '100%', padding: '0 24px', gap: '24px' }}>
      <StationHeader 
        moduleName={t('shell.audit')}
        engineId="AUDIT_ORCHESTRATOR_V6"
      />
      
      <section className="module-grid" style={{ flex: 1, minHeight: 0 }}>
        <div className="module-col-main" style={{ gridColumn: 'span 12' }}>
           <AuditStation />
        </div>
      </section>
    </div>
  );
}
