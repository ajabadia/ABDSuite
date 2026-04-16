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

function LetterPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'templates';

  const renderView = () => {
    switch (view) {
      case 'mapping':
        return <MappingMatrix />;
      case 'config':
        return <LetterPresetEditor />;
      case 'generation':
        return <LetterStation onOpenMapping={() => {}} />; // mapping is now a separate view
      case 'audit':
        return <AuditStation />;
      case 'templates':
      default:
        return <TemplateEditor />;
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
        <div className="module-col-main" style={{ gridColumn: 'span 12', height: '100%', overflow: 'hidden' }}>
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
