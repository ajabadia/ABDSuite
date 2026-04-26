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
        if (confirm(`¿ELIMINAR CÓDIGO ${entry.codigoDocumento}?`)) {
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
                    <span className="station-registry-item-meta">PROCESO: {entry.procesoCodigo} · SOPORTE: {entry.formatoSoporte}</span>
                </div>
                <div className="flex-row" style={{ width: '200px' }}>
                    {template ? (
                        <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
                            <FileTextIcon size={12} style={{ opacity: 0.5 }} />
                            <span className="station-registry-item-meta" style={{ fontSize: '0.75rem' }}>{template.name.substring(0, 20)}...</span>
                        </div>
                    ) : <span className="station-empty-state" style={{ fontSize: '0.7rem' }}>SIN_PLANTILLA</span>}
                </div>
                <div className="flex-row" style={{ width: '200px' }}>
                    {profile ? (
                        <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
                            <ShieldCheckIcon size={12} color="var(--status-ok)" />
                            <span className="station-registry-item-meta" style={{ fontSize: '0.75rem' }}>{profile.name.substring(0, 20)}...</span>
                        </div>
                    ) : <span className="station-empty-state" style={{ fontSize: '0.7rem' }}>SIN_GOLDEN</span>}
                </div>
                <div style={{ width: '100px', textAlign: 'center' }}>
                    <button 
                        className={`station-badge ${entry.isActive ? 'station-badge-blue' : 'station-badge-orange'} tiny`}
                        onClick={() => toggleStatus(entry)}
                        style={{ cursor: 'pointer' }}
                    >
                        {entry.isActive ? 'ACTIVO' : 'BAJA'}
                    </button>
                </div>
                <div style={{ width: '100px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="station-btn icon-only secondary tiny" onClick={() => {
                        setEditingEntry(entry);
                        setIsEditorOpen(true);
                    }} title="Editar"><EditIcon size={14}/></button>
                    <button className="station-btn icon-only secondary tiny" onClick={() => handleDelete(entry)} title="Borrar"><TrashIcon size={14}/></button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-col fade-in" style={{ height: '100%', gap: '24px' }}>
            <header className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                    <div className="station-icon-box primary">
                        <TagIcon size={20} />
                    </div>
                    <div>
                        <h2 className="station-form-section-title" style={{ margin: 0 }}>CATÁLOGO LOCAL DE DOCUMENTOS</h2>
                        <span className="station-registry-item-meta">COORDINACIÓN HOST Xnnnnn · CATDOCUM STATION</span>
                    </div>
                </div>

                <div className="flex-row" style={{ gap: '16px' }}>
                    <div className="station-field-container" style={{ width: '300px', flexDirection: 'row', alignItems: 'center', background: 'var(--surface-color)', padding: '0 12px' }}>
                        <SearchIcon size={14} style={{ opacity: 0.4 }} />
                        <input 
                            className="station-input" 
                            style={{ border: 'none', background: 'transparent' }}
                            placeholder="BUSCAR CÓDIGO O NOMBRE..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="station-btn station-btn-primary" onClick={() => {
                        setEditingEntry({ isActive: true, formatoSoporte: '04', procesoCodigo: 'CAH' });
                        setIsEditorOpen(true);
                    }}>
                        <PlusIcon size={16} /> NUEVO_DOC
                    </button>
                </div>
            </header>

            <div className="station-card flex-col" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
                <div className="station-table-header">
                    <div style={{ width: '100px' }}>CÓDIGO</div>
                    <div style={{ flex: 1 }}>DESCRIPCIÓN / METADATOS</div>
                    <div style={{ width: '200px' }}>PLANTILLA PREDETERMINADA</div>
                    <div style={{ width: '200px' }}>PERFIL GOLDEN GAWEB</div>
                    <div style={{ width: '100px', textAlign: 'center' }}>ESTADO</div>
                    <div style={{ width: '100px', textAlign: 'right' }}>ACCIONES</div>
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
                    <form className="station-modal" style={{ maxWidth: '640px' }} onSubmit={handleSave}>
                        <header className="station-modal-header">
                           <h3 className="station-form-section-title" style={{ margin: 0 }}>EDITOR CATDOCUM LOCAL</h3>
                           <button type="button" className="station-btn tiny secondary" onClick={() => setIsEditorOpen(false)}><XIcon size={16}/></button>
                        </header>

                        <div className="station-modal-content" style={{ padding: '24px', gap: '20px' }}>
                            <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="station-field-container">
                                    <label className="station-registry-item-meta">CÓDIGO_HOST (Xnnnnn)</label>
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
                                    <label className="station-registry-item-meta">PROCESO_VINCULADO</label>
                                    <input 
                                        className="station-input" 
                                        placeholder="CAH, CAT, etc."
                                        value={editingEntry?.procesoCodigo || ''}
                                        onChange={e => setEditingEntry({...editingEntry!, procesoCodigo: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="station-field-container">
                                <label className="station-registry-item-meta">NOMBRE DEL DOCUMENTO (DESCRIPTIVO)</label>
                                <input 
                                    className="station-input" 
                                    required 
                                    placeholder="CARTA DE BIENVENIDA..."
                                    value={editingEntry?.name || ''}
                                    onChange={e => setEditingEntry({...editingEntry!, name: e.target.value})}
                                />
                            </div>

                            <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="station-field-container">
                                    <label className="station-registry-item-meta">PLANTILLA LETTER</label>
                                    <select 
                                        className="station-input"
                                        value={editingEntry?.defaultTemplateId || ''}
                                        onChange={e => setEditingEntry({...editingEntry!, defaultTemplateId: e.target.value})}
                                    >
                                        <option value="">-- NINGUNA --</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="station-field-container">
                                    <label className="station-registry-item-meta">PERFIL GOLDEN GAWEB</label>
                                    <select 
                                        className="station-input"
                                        value={editingEntry?.defaultGoldenProfileId || ''}
                                        onChange={e => setEditingEntry({...editingEntry!, defaultGoldenProfileId: e.target.value})}
                                    >
                                        <option value="">-- NINGUNA --</option>
                                        {goldenProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="station-field-container">
                                    <label className="station-registry-item-meta">FORMATO_SOPORTE</label>
                                    <select 
                                        className="station-input"
                                        value={editingEntry?.formatoSoporte || '04'}
                                        onChange={e => setEditingEntry({...editingEntry!, formatoSoporte: e.target.value as any})}
                                    >
                                        <option value="01">01 - A4 CONTINUO</option>
                                        <option value="02">02 - A4 HOJA</option>
                                        <option value="03">03 - ETIQUETA</option>
                                        <option value="04">04 - PRE-IMPRESO</option>
                                        <option value="05">05 - SOBRE</option>
                                    </select>
                                </div>
                                <div className="flex-row" style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <label className="flex-row" style={{ gap: '12px', cursor: 'pointer', alignItems: 'center' }}>
                                        <span className="station-registry-item-meta">ACTIVO_EN_ESTACIÓN</span>
                                        <input 
                                            type="checkbox" 
                                            checked={editingEntry?.isActive ?? true}
                                            onChange={e => setEditingEntry({...editingEntry!, isActive: e.target.checked})}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <footer className="station-modal-footer">
                            <button type="button" className="station-btn secondary" onClick={() => setIsEditorOpen(false)}>CANCELAR</button>
                            <button type="submit" className="station-btn station-btn-primary">GUARDAR_REGISTRO</button>
                        </footer>
                    </form>
                </div>
            )}
        </div>
    );
};
