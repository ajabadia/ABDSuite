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
import { VaultStatusReactor } from '@/components/common/VaultStatusReactor';
import { clsx } from '@/lib/utils/clsx';

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
  const { 
    installationKey, 
    isVaultChallengeOpen, 
    setIsVaultChallengeOpen 
  } = useWorkspace();

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
      case 'catdocum':
        return { title: t('shell.letter_catdocum'), icon: <ListIcon size={28} style={{ opacity: 0.6 }} /> };
      case 'templates':
      default:
        return { title: t('shell.letter_templates'), icon: <FileTextIcon size={28} style={{ opacity: 0.6 }} /> };
    }
  };

  const { title, icon } = getHeaderInfo();

  const tabs = [
    { id: 'generation', label: t('shell.letter_generation') || 'GENERACIÓN', icon: <PlayIcon size={18} /> },
    { id: 'templates', label: t('shell.letter_templates') || 'PLANTILLAS', icon: <FileTextIcon size={18} /> },
    { id: 'mapping', label: t('shell.letter_mapping') || 'MAPEADOS', icon: <MapIcon size={18} /> },
    { id: 'catdocum', label: t('shell.letter_catdocum') || 'CATDOCUM', icon: <ListIcon size={18} /> },
    { id: 'audit', label: t('shell.letter_audit') || 'AUDITORÍA', icon: <ShieldCheckIcon size={18} /> },
    { id: 'config', label: t('shell.letter_config') || 'CONFIG', icon: <CogIcon size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', padding: '0 24px' }}>
      <header className="module-header-industrial" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        padding: '24px 0',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1rem' }}>
            <span style={{ color: 'var(--primary-color)' }}>{icon}</span>
            {title.toUpperCase()}
          </div>
          
          <div className="flex-row" style={{ gap: '12px' }}>
             <VaultStatusReactor />
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => router.push(`/letter?view=${tab.id}`)}
              className={clsx('station-btn tiny', { 'primary-glow': view === tab.id })}
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: view === tab.id ? 'var(--primary-color)' : 'transparent', color: view === tab.id ? 'white' : 'inherit' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="module-grid" style={{ flex: 1, minHeight: 0, marginTop: '12px' }}>
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
