'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import LetterStation from '@/components/LetterStation/LetterStation';
import TemplateEditor from '@/components/LetterStation/TemplateEditor';
import MappingMatrix from '@/components/LetterStation/MappingMatrix';
import LetterPresetEditor from '@/components/LetterStation/LetterPresetEditor';
import AuditStation from '@/components/AuditStation/AuditStation';
import { FileTextIcon, MapIcon, PlayIcon, ShieldCheckIcon, CogIcon, ListIcon } from '@/components/common/Icons';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';
import CatDocumAdmin from '@/components/catdocum/CatDocumAdmin';
import { RendererProvider } from '@/components/common/useRendererEngine';
import { StationHeader } from '@/components/shell/StationHeader';

function LetterPageContent() {
  const { t } = useLanguage();
  const { can } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const view = searchParams.get('view') || 'templates';

  if (!isMounted) return null;

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
      case 'catdocum':
        return can('LETTER_VIEW') ? <CatDocumAdmin /> : <ForbiddenPanel />;
      case 'templates':
      default:
        return <TemplateEditor canEdit={can('LETTER_EDIT_TEMPLATES')} />;
    }
  };

  const tabs = [
    { id: 'generation', label: t('shell.letter_generation'), icon: <PlayIcon size={14} />, active: view === 'generation', onClick: () => router.push('/letter?view=generation') },
    { id: 'templates', label: t('shell.letter_templates'), icon: <FileTextIcon size={14} />, active: view === 'templates', onClick: () => router.push('/letter?view=templates') },
    { id: 'mapping', label: t('shell.letter_mapping'), icon: <MapIcon size={14} />, active: view === 'mapping', onClick: () => router.push('/letter?view=mapping') },
    { id: 'catdocum', label: t('shell.letter_catdocum'), icon: <ListIcon size={14} />, active: view === 'catdocum', onClick: () => router.push('/letter?view=catdocum') },
    { id: 'audit', label: t('shell.letter_audit'), icon: <ShieldCheckIcon size={14} />, active: view === 'audit', onClick: () => router.push('/letter?view=audit') },
    { id: 'config', label: t('shell.letter_config'), icon: <CogIcon size={14} />, active: view === 'config', onClick: () => router.push('/letter?view=config') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 24px' }}>
      <StationHeader 
        moduleName={t('shell.letter')}
        engineId="LETTER_ENGINE_V6"
        tabs={tabs}
      />

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
      <RendererProvider>
        <LetterPageContent />
      </RendererProvider>
    </Suspense>
  );
}
