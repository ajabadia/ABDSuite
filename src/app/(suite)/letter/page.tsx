'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import LetterStation from '@/components/LetterStation/LetterStation';
import TemplateEditor from '@/components/LetterStation/TemplateEditor';
import MappingMatrix from '@/components/LetterStation/MappingMatrix';
import LetterPresetEditor from '@/components/LetterStation/LetterPresetEditor';
import AuditStation from '@/components/AuditStation/AuditStation';
import { FileTextIcon, MapIcon, PlayIcon, ShieldCheckIcon, CogIcon } from '@/components/common/Icons';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';

function LetterPageContent() {
  const { t } = useLanguage();
  const { can } = useWorkspace();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'templates';

  if (!can('LETTER_VIEW')) {
    return <ForbiddenPanel />;
  }

  const renderView = () => {
    switch (view) {
      case 'mapping':
        return can('LETTER_EDIT_MAPPINGS') ? <MappingMatrix /> : <ForbiddenPanel />;
      case 'config':
        return can('LETTER_CONFIG_GLOBAL') ? <LetterPresetEditor /> : <ForbiddenPanel />;
      case 'generation':
        return can('LETTER_GENERATE') ? <LetterStation /> : <ForbiddenPanel />;
      case 'audit':
        return can('AUDIT_VIEW') ? <AuditStation /> : <ForbiddenPanel />;
      case 'templates':
      default:
        return <TemplateEditor canEdit={can('LETTER_EDIT_TEMPLATES')} />;
    }
  };

  const getHeaderInfo = () => {
    switch (view) {
      case 'mapping':
        return { title: t('shell.letter_mapping'), icon: <MapIcon size={28} style={{ opacity: 0.6 }} /> };
      case 'config':
        return { title: t('shell.letter_config'), icon: <CogIcon size={28} style={{ opacity: 0.6 }} /> };
      case 'generation':
        return { title: t('shell.letter_generation'), icon: <PlayIcon size={28} style={{ opacity: 0.6 }} /> };
      case 'audit':
        return { title: t('shell.letter_audit'), icon: <ShieldCheckIcon size={28} style={{ opacity: 0.6 }} /> };
      case 'templates':
      default:
        return { title: t('shell.letter_templates'), icon: <FileTextIcon size={28} style={{ opacity: 0.6 }} /> };
    }
  };

  const { title, icon } = getHeaderInfo();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <header className="module-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.2rem', fontWeight: 800 }}>
          {icon}
          {title}
        </div>
      </header>

      <section className="module-grid" style={{ flex: 1, minHeight: 0 }}>
        <div className="module-col-main" style={{ gridColumn: 'span 12' }}>
          {renderView()}
        </div>
      </section>
    </div>
  );
}

export default function LetterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LetterPageContent />
    </Suspense>
  );
}
