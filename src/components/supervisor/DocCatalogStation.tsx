'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { DocCatalogService } from '@/lib/services/DocCatalogService';
import { LocalDocCatalogEntry } from '@/lib/types/doc-catalog.types';
import { 
  FileTextIcon, 
  SearchIcon, 
  PlusIcon, 
  TagIcon, 
  ShieldCheckIcon, 
  CheckCircleIcon,
  XIcon,
  EditIcon,
  TrashIcon
} from '../common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { IndustrialVirtualTable } from '../common/IndustrialVirtualTable';

/**
 * DocCatalogStation (Phase 18)
 * Industrial Maestro for CATDOCUM (Document Catalog).
 * Ties HOST codes to Suite Templates and Golden Profiles.
 */
export const DocCatalogStation: React.FC = () => {
    const { t } = useLanguage();
    const { currentOperator } = useWorkspace();
    const entries = useLiveQuery(() => db.doc_catalog_v1.toArray()) || [];
    const templates = useLiveQuery(() => db.lettertemplates_v6.toArray()) || [];
    const goldenProfiles = useLiveQuery(() => db.gaweb_golden_profiles_v6.toArray()) || [];

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Partial<LocalDocCatalogEntry> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEntries = entries.filter(e => 
        e.codigoDocumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEntry?.codigoDocumento || !editingEntry?.name) return;

        const entry: LocalDocCatalogEntry = {
            id: editingEntry.id || crypto.randomUUID(),
            codigoDocumento: editingEntry.codigoDocumento.toUpperCase(),
            name: editingEntry.name,
            procesoCodigo: editingEntry.procesoCodigo || 'CAH',
            formatoSoporte: (editingEntry.formatoSoporte as any) || '04',
            defaultTemplateId: editingEntry.defaultTemplateId,
            defaultGoldenProfileId: editingEntry.defaultGoldenProfileId,
            isActive: editingEntry.isActive ?? true,
            createdAt: editingEntry.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        await DocCatalogService.saveEntry(entry, currentOperator?.id);
        setIsEditorOpen(false);
        setEditingEntry(null);
    };

    const toggleStatus = async (entry: LocalDocCatalogEntry) => {
        await DocCatalogService.toggleStatus(entry.id, currentOperator?.id);
    };

    const handleDelete = async (entry: LocalDocCatalogEntry) => {
        if (confirm(t('supervisor.cat_confirm_delete', { code: entry.codigoDocumento }))) {
            await DocCatalogService.deleteEntry(entry.id, currentOperator?.id);
        }
    };

    const renderRow = (entry: LocalDocCatalogEntry, idx: number, style: React.CSSProperties) => {
        const template = templates.find(t => t.id === entry.defaultTemplateId);
        const profile = goldenProfiles.find(p => p.id === entry.defaultGoldenProfileId);

        return (
            <div key={entry.id} style={style} className="station-registry-item">
                <div className="flex-row" style={{ width: '100px' }}>
                    <span className="station-title-main" style={{ color: 'var(--primary-color)' }}>{entry.codigoDocumento}</span>
                </div>
                <div className="flex-col" style={{ flex: 1 }}>
                    <span className="station-title-main">{entry.name}</span>
                    <span className="station-registry-item-meta">PROCESS: {entry.procesoCodigo} · FORMAT: {entry.formatoSoporte}</span>
                </div>
                <div className="flex-row" style={{ width: '200px' }}>
                    {template ? (
                        <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
                            <FileTextIcon size={12} style={{ opacity: 0.5 }} />
                             <span className="station-registry-item-meta" style={{ fontSize: '0.75rem' }}>{template.name.substring(0, 20)}...</span>
                        </div>
                    ) : <span className="station-empty-state" style={{ fontSize: '0.7rem' }}>{t('supervisor.cat_no_template').toUpperCase()}</span>}
                </div>
                <div className="flex-row" style={{ width: '200px' }}>
                    {profile ? (
                        <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
                            <ShieldCheckIcon size={12} color="var(--status-ok)" />
                             <span className="station-registry-item-meta" style={{ fontSize: '0.75rem' }}>{profile.name.substring(0, 20)}...</span>
                        </div>
                    ) : <span className="station-empty-state" style={{ fontSize: '0.7rem' }}>{t('supervisor.cat_no_profile').toUpperCase()}</span>}
                </div>
                <div style={{ width: '100px', textAlign: 'center' }}>
                    <button 
                        className={`station-badge ${entry.isActive ? 'station-badge-blue' : 'station-badge-orange'} tiny`}
                         onClick={() => toggleStatus(entry)}
                         style={{ cursor: 'pointer' }}
                     >
                         {entry.isActive ? t('supervisor.cat_active').toUpperCase() : t('supervisor.cat_inactive').toUpperCase()}
                     </button>
                </div>
                <div style={{ width: '100px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                     <button className="station-btn icon-only secondary tiny" onClick={() => {
                        setEditingEntry(entry);
                        setIsEditorOpen(true);
                    }} title={t('common.edit')}><EditIcon size={14}/></button>
                    <button className="station-btn icon-only secondary tiny" onClick={() => handleDelete(entry)} title={t('common.delete')}><TrashIcon size={14}/></button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-col fade-in" style={{ height: '100%', gap: '24px', paddingTop: '16px' }}>
            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                 <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                    <TagIcon size={18} color="var(--primary-color)" />
                    <h3 className="station-form-section-title" style={{ margin: 0 }}>{t('supervisor.cat_title').toUpperCase()}</h3>
                </div>

                <div className="flex-row" style={{ gap: '12px' }}>
                    <div className="station-field-container" style={{ width: '320px', flexDirection: 'row', alignItems: 'center', background: 'var(--surface-color)', padding: '0 12px', height: '36px' }}>
                        <SearchIcon size={14} style={{ opacity: 0.4 }} />
                         <input 
                            className="station-input" 
                            style={{ border: 'none', background: 'transparent', height: '100%' }}
                            placeholder={t('supervisor.cat_search').toUpperCase()} 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <button className="station-btn station-btn-primary" onClick={() => {
                        setEditingEntry({ isActive: true, formatoSoporte: '04', procesoCodigo: 'CAH' });
                        setIsEditorOpen(true);
                    }}>
                        <PlusIcon size={16} /> {t('supervisor.cat_new').toUpperCase()}
                    </button>
                </div>
            </div>

            <div className="station-card flex-col" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
                 <div className="station-table-header" style={{ background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', height: '40px', fontSize: '0.65rem', fontWeight: 900, opacity: 0.5 }}>
                    <div style={{ width: '100px', paddingLeft: '16px' }}>{t('supervisor.cat_code').toUpperCase()}</div>
                    <div style={{ flex: 1 }}>{t('supervisor.cat_desc').toUpperCase()}</div>
                    <div style={{ width: '200px' }}>{t('supervisor.cat_template').toUpperCase()}</div>
                    <div style={{ width: '200px' }}>{t('supervisor.cat_profile').toUpperCase()}</div>
                    <div style={{ width: '100px', textAlign: 'center' }}>{t('supervisor.cat_status').toUpperCase()}</div>
                    <div style={{ width: '100px', textAlign: 'right', paddingRight: '16px' }}>{t('supervisor.cat_actions').toUpperCase()}</div>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                    <IndustrialVirtualTable 
                        items={filteredEntries}
                        totalItems={filteredEntries.length}
                        itemHeight={52}
                        renderRow={renderRow}
                    />
                </div>
            </div>

            {isEditorOpen && (
                <div className="station-modal-overlay fade-in" style={{ zIndex: 1000 }}>
                    <form className="station-modal" style={{ maxWidth: '720px', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }} onSubmit={handleSave}>
                        <header className="station-modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '20px 24px' }}>
                           <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                               <TagIcon size={18} color="var(--primary-color)" />
                               <h3 className="station-form-section-title" style={{ margin: 0 }}>CATDOCUM_REGISTRY_EDITOR</h3>
                           </div>
                           <button type="button" className="station-btn tiny secondary" onClick={() => setIsEditorOpen(false)}><XIcon size={16}/></button>
                        </header>

                        <div className="station-modal-content flex-col" style={{ padding: '32px', gap: '24px' }}>
                            <div className="station-card flex-col" style={{ gap: '20px', padding: '24px' }}>
                                <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="station-field-container">
                                        <label className="station-registry-item-meta">HOST_DOCUMENT_CODE (Xnnnnn)</label>
                                        <input 
                                            className="station-input" 
                                            required 
                                            maxLength={6}
                                            placeholder="X00001"
                                            value={editingEntry?.codigoDocumento || ''}
                                            onChange={e => setEditingEntry({...editingEntry!, codigoDocumento: e.target.value})}
                                        />
                                    </div>
                                    <div className="station-field-container">
                                        <label className="station-registry-item-meta">LINKED_PROCESS_CODE</label>
                                        <input 
                                            className="station-input" 
                                            placeholder="CAH, CAT, ETC."
                                            value={editingEntry?.procesoCodigo || ''}
                                            onChange={e => setEditingEntry({...editingEntry!, procesoCodigo: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="station-field-container">
                                    <label className="station-registry-item-meta">DOCUMENT_DESCRIPTION (HUMAN_READABLE)</label>
                                    <input 
                                        className="station-input" 
                                        required 
                                        placeholder="WELCOME_LETTER_PROFILE..."
                                        value={editingEntry?.name || ''}
                                        onChange={e => setEditingEntry({...editingEntry!, name: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="station-card flex-col" style={{ gap: '20px', padding: '24px' }}>
                                <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="station-field-container">
                                        <label className="station-registry-item-meta">DEFAULT_LETTER_TEMPLATE</label>
                                        <select 
                                            className="station-input"
                                            value={editingEntry?.defaultTemplateId || ''}
                                            onChange={e => setEditingEntry({...editingEntry!, defaultTemplateId: e.target.value})}
                                        >
                                            <option value="">-- NO_TEMPLATE_LINKED --</option>
                                            {templates.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div className="station-field-container">
                                        <label className="station-registry-item-meta">DEFAULT_GOLDEN_PROFILE</label>
                                        <select 
                                            className="station-input"
                                            value={editingEntry?.defaultGoldenProfileId || ''}
                                            onChange={e => setEditingEntry({...editingEntry!, defaultGoldenProfileId: e.target.value})}
                                        >
                                            <option value="">-- NO_PROFILE_LINKED --</option>
                                            {goldenProfiles.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="station-field-container">
                                        <label className="station-registry-item-meta">STORAGE_FORMAT_SUPPORT</label>
                                        <select 
                                            className="station-input"
                                            value={editingEntry?.formatoSoporte || '04'}
                                            onChange={e => setEditingEntry({...editingEntry!, formatoSoporte: e.target.value as any})}
                                        >
                                            <option value="01">01 - A4_CONTINUOUS</option>
                                            <option value="02">02 - A4_SHEET</option>
                                            <option value="03">03 - LABEL_ADHESIVE</option>
                                            <option value="04">04 - PRE_PRINTED_STATIONERY</option>
                                            <option value="05">05 - ENVELOPE_FORMAT</option>
                                        </select>
                                    </div>
                                    <div className="flex-row" style={{ alignItems: 'flex-end', paddingBottom: '8px' }}>
                                        <label className="flex-row" style={{ gap: '12px', cursor: 'pointer', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '4px', width: '100%' }}>
                                            <input 
                                                type="checkbox" 
                                                style={{ width: '18px', height: '18px' }}
                                                checked={editingEntry?.isActive ?? true}
                                                onChange={e => setEditingEntry({...editingEntry!, isActive: e.target.checked})}
                                            />
                                            <span className="station-title-main" style={{ fontSize: '0.7rem' }}>REGISTRY_ACTIVE_IN_NODE</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <footer className="station-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '20px 24px', background: 'rgba(255,255,255,0.02)' }}>
                            <button type="button" className="station-btn secondary" onClick={() => setIsEditorOpen(false)}>CANCEL_CHANGES</button>
                            <button type="submit" className="station-btn station-btn-primary">COMMIT_REGISTRY_RECORD</button>
                        </footer>
                    </form>
                </div>
            )}
        </div>
    );
};
