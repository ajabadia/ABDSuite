'use client';

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { 
  XIcon, 
  DownloadIcon, 
  UploadIcon, 
  ShieldCheckIcon, 
  FileTextIcon, 
  ListIcon, 
  GlobeIcon, 
  LockIcon,
  RefreshIcon,
  ActivityIcon
} from '@/components/common/Icons';
import { DbSyncService } from '@/lib/services/db-sync.service';
import { ExportOptions } from '@/lib/types/dump.types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { currentOperator, requestStepUp } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [passphrase, setPassphrase] = useState('');
  const [options, setOptions] = useState<ExportOptions>({
    includeEtl: true,
    includeLetter: true,
    includeCatalog: true,
    includeGaweb: true,
    includeAudit: true
  });
  const [importMode, setImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!passphrase) {
      alert(t('sync.passphrase_label') + ' required');
      return;
    }

    if (!(await requestStepUp(2))) return;

    setIsProcessing(true);
    try {
      const blob = await DbSyncService.exportSuite(passphrase, currentOperator?.id || 'system', options);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `abdfn_suite_dump_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert(t('sync.export_success'));
      onClose();
    } catch (err) {
      console.error('Export failed', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!passphrase || !importFile) {
      alert('Passphrase and file required');
      return;
    }

    const confirmed = confirm(t('sync.import_confirm'));
    if (!confirmed) return;

    if (!(await requestStepUp(2))) return;

    setIsProcessing(true);
    try {
      await DbSyncService.importSuite(importFile, passphrase, currentOperator?.id || 'system', importMode, options);
      alert(t('sync.import_success'));
      window.location.reload();
    } catch (err) {
      console.error('Import failed', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="station-modal-overlay" onClick={onClose}>
      <div 
        className="station-modal" 
        style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column' }} 
        onClick={e => e.stopPropagation()}
      >
        <header className="station-modal-header">
          <div className="flex-row" style={{ gap: '12px' }}>
            <RefreshIcon size={20} style={{ color: 'var(--primary-color)' }} />
            <h2 className="station-registry-item-name">{t('sync.title')}</h2>
          </div>
          <button className="station-btn icon-only" onClick={onClose} disabled={isProcessing}>
            <XIcon size={18} />
          </button>
        </header>

        <div className="station-tabs" style={{ margin: '20px 24px 0' }}>
          <button 
            className={`station-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
            disabled={isProcessing}
          >
            <DownloadIcon size={16} />
            {t('sync.export_tab')}
          </button>
          <button 
            className={`station-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
            disabled={isProcessing}
          >
            <UploadIcon size={16} />
            {t('sync.import_tab')}
          </button>
        </div>

        <div className="station-modal-content" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          <div className="flex-col" style={{ gap: '24px' }}>
            
            {/* Module Selection */}
            <section className="station-property-group">
              <span className="station-property-title">{t('sync.modules_title')}</span>
              <div className="flex-col" style={{ gap: '12px', marginTop: '8px' }}>
                <label className="station-checkbox-group">
                  <input 
                    type="checkbox" 
                    className="station-checkbox" 
                    checked={options.includeEtl} 
                    onChange={() => toggleOption('includeEtl')}
                  />
                  <ListIcon size={16} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.8rem' }}>{t('sync.module_etl')}</span>
                </label>
                <label className="station-checkbox-group">
                  <input 
                    type="checkbox" 
                    className="station-checkbox" 
                    checked={options.includeLetter} 
                    onChange={() => toggleOption('includeLetter')}
                  />
                  <FileTextIcon size={16} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.8rem' }}>{t('sync.module_letter')}</span>
                </label>
                <label className="station-checkbox-group">
                  <input 
                    type="checkbox" 
                    className="station-checkbox" 
                    checked={options.includeCatalog} 
                    onChange={() => toggleOption('includeCatalog')}
                  />
                  <GlobeIcon size={16} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.8rem' }}>{t('sync.module_catalog')}</span>
                </label>
                <label className="station-checkbox-group">
                  <input 
                    type="checkbox" 
                    className="station-checkbox" 
                    checked={options.includeGaweb} 
                    onChange={() => toggleOption('includeGaweb')}
                  />
                  <ShieldCheckIcon size={16} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.8rem' }}>{t('sync.module_gaweb')}</span>
                </label>
                <label className="station-checkbox-group">
                  <input 
                    type="checkbox" 
                    className="station-checkbox" 
                    checked={options.includeAudit} 
                    onChange={() => toggleOption('includeAudit')}
                  />
                  <ActivityIcon size={16} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.8rem' }}>{t('sync.module_audit')}</span>
                </label>
              </div>
            </section>

            {/* Strategy Selection (Import Only) */}
            {activeTab === 'import' && (
              <section className="station-property-group">
                <span className="station-property-title">{t('sync.strategy_title')}</span>
                <div className="flex-col" style={{ gap: '12px', marginTop: '8px' }}>
                  <label className="station-checkbox-group">
                    <input 
                      type="radio" 
                      name="importStrategy"
                      className="station-checkbox" 
                      checked={importMode === 'MERGE'} 
                      onChange={() => setImportMode('MERGE')}
                      style={{ borderRadius: '50%' }}
                    />
                    <span style={{ fontSize: '0.8rem' }}>{t('sync.strategy_merge')}</span>
                  </label>
                  <label className="station-checkbox-group">
                    <input 
                      type="radio" 
                      name="importStrategy"
                      className="station-checkbox" 
                      checked={importMode === 'REPLACE'} 
                      onChange={() => setImportMode('REPLACE')}
                      style={{ borderRadius: '50%' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--error-color)' }}>{t('sync.strategy_replace')}</span>
                  </label>
                </div>
              </section>
            )}

            {/* Passphrase & File */}
            <section className="flex-col" style={{ gap: '16px' }}>
              {activeTab === 'import' && (
                <div className="station-form-field">
                  <label className="station-label">{t('sync.file_label')}</label>
                  <div 
                    className="station-input" 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon size={14} />
                    <span>{importFile ? importFile.name : 'SELECT FILE...'}</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      accept=".json"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              )}

              <div className="station-form-field">
                <label className="station-label">{t('sync.passphrase_label')}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    className="station-input" 
                    placeholder={t('sync.passphrase_placeholder')}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    autoComplete="new-password"
                  />
                  <LockIcon size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                </div>
                <span style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '4px' }}>{t('sync.passphrase_hint')}</span>
              </div>
            </section>

          </div>
        </div>

        <footer className="station-modal-footer" style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
          <button 
            className="station-btn" 
            style={{ flex: 1 }} 
            onClick={onClose}
            disabled={isProcessing}
          >
            {t('shell.menu_close')}
          </button>
          <button 
            className="station-btn station-btn-primary" 
            style={{ flex: 2 }}
            onClick={activeTab === 'export' ? handleExport : handleImport}
            disabled={isProcessing || (activeTab === 'import' && !importFile)}
          >
            {isProcessing ? (
              <RefreshIcon size={16} className="spin" />
            ) : (
              activeTab === 'export' ? <DownloadIcon size={16} /> : <UploadIcon size={16} />
            )}
            {activeTab === 'export' ? t('sync.execute_export') : t('sync.execute_import')}
          </button>
        </footer>
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .station-checkbox-group input[type="radio"]:checked::after {
          content: "●";
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};
