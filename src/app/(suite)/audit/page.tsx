'use client';

import React from 'react';
import AuditStation from '@/components/AuditStation/AuditStation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';

export default function AuditPage() {
  const { t } = useLanguage();
  const { can } = useWorkspace();

  if (!can('AUDIT_VIEW')) {
    return <ForbiddenPanel />;
  }

  return (
    <div className="animate-fade-in module-grid">
      <section className="module-col-main">
        <header className="module-title">
          {t('shell.audit')}
        </header>
        
        <div className="module-section" style={{ padding: 0, overflow: 'hidden' }}>
          <AuditStation />
        </div>
      </section>

      <section className="module-col-side" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Module specific documentation can go here if needed in the future */}
      </section>
    </div>
  );
}
