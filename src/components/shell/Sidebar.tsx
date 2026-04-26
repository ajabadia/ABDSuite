'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { 
  SystemIcon, 
  LockIcon, 
  ListIcon, 
  FileTextIcon, 
  ShieldCheckIcon,
  CogIcon,
  PlayIcon,
  UnlockIcon,
  MapIcon,
  GlobeIcon,
  HelpIcon,
  DownloadIcon,
  UploadIcon,
  ActivityIcon,
  LogOutIcon,
  UserIcon
} from '@/components/common/Icons';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useUI } from '@/lib/context/UIContext';
import { HelpModal } from './HelpModal';

export const Sidebar: React.FC = () => {
  const { isSidebarCollapsed: isCollapsed, setSidebarCollapsed: setIsCollapsed, isMobileMenuOpen } = useUI();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();
  
  const [etlExpanded, setEtlExpanded] = useState(pathname.startsWith('/etl'));
  const [cryptExpanded, setCryptExpanded] = useState(pathname.startsWith('/crypt'));
  const [letterExpanded, setLetterExpanded] = useState(pathname.startsWith('/letter'));
  const [regulatoryExpanded, setRegulatoryExpanded] = useState(pathname.startsWith('/regulatory'));
  
  // Auto-collapse logic
  useEffect(() => {
    // ETL
    if (!pathname.startsWith('/etl')) {
      setEtlExpanded(false);
    } else if (!etlExpanded && pathname.startsWith('/etl')) {
      setEtlExpanded(true);
    }
    
    // Crypt
    if (!pathname.startsWith('/crypt')) {
      setCryptExpanded(false);
    } else if (!cryptExpanded && pathname.startsWith('/crypt')) {
      setCryptExpanded(true);
    }

    // Letter
    if (!pathname.startsWith('/letter')) {
      setLetterExpanded(false);
    } else if (!letterExpanded && pathname.startsWith('/letter')) {
      setLetterExpanded(true);
    }

    // Regulatory
    if (!pathname.startsWith('/regulatory')) {
      setRegulatoryExpanded(false);
    } else if (!regulatoryExpanded && pathname.startsWith('/regulatory')) {
      setRegulatoryExpanded(true);
    }
  }, [pathname]);

  const navItems = [
    { href: '/', icon: <SystemIcon size={20} />, label: t('shell.home'), id: 'home' },
    { 
      id: 'crypt', 
      icon: <LockIcon size={20} />, 
      label: t('shell.crypt'),
      isAccordion: true,
      expanded: cryptExpanded,
      setExpanded: setCryptExpanded,
      activePath: '/crypt',
      subItems: [
        { href: '/crypt?view=encrypt', icon: <ShieldCheckIcon size={14} />, label: t('crypt.shield_vault'), id: 'crypt-encrypt' },
        { href: '/crypt?view=decrypt', icon: <UnlockIcon size={14} />, label: t('crypt.open_key'), id: 'crypt-decrypt' },
      ]
    },
    { 
      id: 'etl', 
      icon: <ListIcon size={20} />, 
      label: t('shell.etl'),
      isAccordion: true,
      expanded: etlExpanded,
      setExpanded: setEtlExpanded,
      activePath: '/etl',
      subItems: [
        { href: '/etl?view=designer', icon: <CogIcon size={14} />, label: t('etl.app_designer'), id: 'etl-designer' },
        { href: '/etl?view=executor', icon: <PlayIcon size={14} />, label: t('etl.app_executor'), id: 'etl-executor' },
      ]
    },
    { 
      id: 'letter', 
      icon: <FileTextIcon size={20} />, 
      label: t('shell.letter'),
      isAccordion: true,
      expanded: letterExpanded,
      setExpanded: setLetterExpanded,
      activePath: '/letter',
      subItems: [
        { href: '/letter?view=templates', icon: <FileTextIcon size={14} />, label: t('shell.letter_templates'), id: 'letter-templates' },
        { href: '/letter?view=config', icon: <CogIcon size={14} />, label: t('shell.letter_config') || 'CONFIGURACIÓN', id: 'letter-config' },
        { href: '/letter?view=mapping', icon: <MapIcon size={14} />, label: t('shell.letter_mapping'), id: 'letter-mapping' },
        { href: '/letter?view=catdocum', icon: <ListIcon size={14} />, label: t('shell.letter_catdocum'), id: 'letter-catdocum' },
        { href: '/letter?view=generation', icon: <PlayIcon size={14} />, label: t('shell.letter_generation'), id: 'letter-generation' },
        { href: '/letter?view=audit', icon: <ShieldCheckIcon size={14} />, label: t('shell.letter_audit'), id: 'letter-audit' },
      ]
    },
    { 
      id: 'regtech', 
      icon: <ShieldCheckIcon size={20} />, 
      label: t('shell.regtech'),
      isAccordion: true,
      expanded: regulatoryExpanded,
      setExpanded: setRegulatoryExpanded,
      activePath: '/regulatory',
      subItems: [
        { href: '/regulatory?view=one-by-one', icon: <UserIcon size={14} />, label: t('shell.regtech_one_by_one'), id: 'regtech-one' },
        { href: '/regulatory?view=batch', icon: <ListIcon size={14} />, label: t('shell.regtech_batch'), id: 'regtech-batch' },
        { href: '/regulatory/registry', icon: <GlobeIcon size={14} />, label: t('shell.regtech_registry') || 'REGISTRO GLOBAL', id: 'regtech-registry' },
      ]
    },
  ];

  const { can, currentOperator, lockSession, logout, isLocked, requireFreshAuth, requestStepUp } = useWorkspace();
  const canSeeSupervisor = can('SUPERVISOR_VIEW');

  if (canSeeSupervisor) {
    navItems.push({
        href: '/supervisor',
        icon: <ActivityIcon size={20} />,
        label: t('supervisor.title'),
        id: 'supervisor'
    });
  }

  return (
    <aside className={`shell-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
        {!isCollapsed && <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-color)' }}>ABDSuite</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="station-btn"
          style={{ padding: '6px', minWidth: '32px', boxShadow: 'none' }}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      <nav style={{ flex: 1, paddingTop: '12px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          if (item.isAccordion) {
            const isAnySubActive = pathname.startsWith(item.activePath || '');
            const isExpanded = item.expanded;
            return (
              <div key={item.id} className="flex-col">
                <button 
                  className={`station-nav-item ${isAnySubActive ? 'active' : ''}`}
                  onClick={() => !isCollapsed && item.setExpanded?.(!isExpanded)}
                >
                  <span className="station-nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center' }}>
                      <span className="station-nav-label">{item.label}</span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  )}
                </button>
                
                <div className={`station-nav-anim-container ${isExpanded && !isCollapsed ? 'expanded' : ''}`}>
                  <div className="station-nav-anim-content">
                    <div className="station-nav-sub-container">
                      {item.subItems?.map(sub => {
                         const isSubActive = pathname === sub.href;
                         return (
                          <Link 
                            key={sub.id}
                            href={sub.href}
                            className={`station-nav-item station-nav-sub-item ${isSubActive ? 'active' : ''}`}
                          >
                            <span className="station-nav-icon">{sub.icon}</span>
                            <span className="station-nav-label">{sub.label}</span>
                          </Link>
                         );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.id}
              href={item.href || '#'}
              className={`station-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="station-nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="station-nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button 
          className="station-nav-item" 
          onClick={async () => {
             if (isLocked) {
               alert(t('auth.locked_engine_hint') || 'Motor de cifrado bloqueado. Desbloquee la clave de instalación antes de exportar.');
               return;
             }
             if (!(await requestStepUp(2))) {
               return;
             }
             const { DbSyncService } = await import('@/lib/services/db-sync.service');
            const passphrase = prompt(t('sync.passphrase_prompt') || 'Enter passphrase to export');
            if (!passphrase) return;
            const blob = await DbSyncService.exportSuite(passphrase, currentOperator?.id || 'system');
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = `abdfn_suite_dump_${new Date().toISOString().split('T')[0]}.json`;
             a.click();
             URL.revokeObjectURL(url);
          }}
          style={{ width: '100%', border: 'none', background: 'transparent' }}
        >
          <span className="station-nav-icon"><DownloadIcon size={20} /></span>
          {!isCollapsed && <span className="station-nav-label">{t('shell.full_dump')}</span>}
        </button>
        
        <button 
          className="station-nav-item" 
          onClick={async () => {
             if (isLocked) {
               alert(t('auth.locked_engine_hint') || 'Motor de cifrado bloqueado. Desbloquee la clave de instalación antes de importar.');
               return;
             }
             if (!(await requestStepUp(2))) {
                return;
             }
             const input = document.createElement('input');
             input.type = 'file';
             input.accept = '.json';
             input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                
                const confirmed = confirm(t('shell.full_restore_confirm') || '¿Está seguro de restaurar el sistema? Esta acción fusionará o reemplazará sus datos actuales.');
                if (!confirmed) return;
                
                const { DbSyncService } = await import('@/lib/services/db-sync.service');
                try {
                  const passphrase = prompt(t('sync.passphrase_prompt') || 'Enter passphrase to import');
                  if (!passphrase) return;
                  await DbSyncService.importSuite(file, passphrase, currentOperator?.id || 'system', 'MERGE');
                  alert(t('shell.full_restore_success') || 'Sistema restaurado con éxito. Por favor, recargue la aplicación.');
                  window.location.reload();
                } catch (err) {
                  console.error('Import failed', err);
                  alert('Error al importar: ' + (err as Error).message);
                }
             };
             input.click();
          }}
          style={{ width: '100%', border: 'none', background: 'transparent' }}
        >
          <span className="station-nav-icon"><UploadIcon size={20} /></span>
          {!isCollapsed && <span className="station-nav-label">{t('shell.full_restore')}</span>}
        </button>

        <button 
          className="station-nav-item" 
          onClick={() => setIsHelpOpen(true)}
          style={{ width: '100%', border: 'none', background: 'transparent' }}
        >
          <span className="station-nav-icon"><HelpIcon size={20} /></span>
          {!isCollapsed && <span className="station-nav-label">{t('shell.help')}</span>}
        </button>
      </div>

      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <button 
          className="station-btn"
          onClick={lockSession}
          title={t('auth.session.lock_btn') || 'Bloquear Puesto'}
          style={{ flex: 1, padding: '8px', background: 'transparent', boxShadow: 'none', border: '1px solid var(--border-color)' }}
        >
          <LockIcon size={16} />
        </button>
        <button 
          className="station-btn"
          onClick={logout}
          title={t('auth.logout')}
          style={{ flex: 1, padding: '8px', background: 'transparent', boxShadow: 'none', border: '1px solid var(--border-color)', color: 'var(--error-color)' }}
        >
          <LogOutIcon size={16} color="var(--error-color)" />
        </button>
      </div>

      {!isCollapsed && (
        <div style={{ padding: '24px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>VERSION 6.1.0-IND</div>
          <div>© ABD INDUSTRIAL INFRASTRUCTURES</div>
        </div>
      )}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </aside>
  );
};
