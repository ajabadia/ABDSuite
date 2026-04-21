'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { LocalDocCatalogEntry } from '@/lib/types/doc-catalog.types';
import { 
  FileTextIcon, 
  SearchIcon, 
  PlusIcon, 
  TagIcon, 
  ShieldCheckIcon, 
  CogIcon, 
  CheckCircleIcon,
  XIcon,
  EditIcon,
  TrashIcon,
  EyeIcon
} from '../common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';
import { IndustrialVirtualTable } from '../common/IndustrialVirtualTable';

/**
 * DocCatalogStation (Phase 18)
 * Industrial Maestro for CATDOCUM (Document Catalog).
 * Ties HOST codes to Suite Templates and Golden Profiles.
 */
export const DocCatalogStation: React.FC = () => {
    const { t } = useLanguage();
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

        await db.doc_catalog_v1.put(entry);
        setIsEditorOpen(false);
        setEditingEntry(null);
    };

    const toggleStatus = async (entry: LocalDocCatalogEntry) => {
        await db.doc_catalog_v1.update(entry.id, { isActive: !entry.isActive, updatedAt: Date.now() });
    };

    const renderRow = (entry: LocalDocCatalogEntry, idx: number, style: React.CSSProperties) => {
        const template = templates.find(t => t.id === entry.defaultTemplateId);
        const profile = goldenProfiles.find(p => p.id === entry.defaultGoldenProfileId);

        return (
            <div key={entry.id} style={{
                ...style,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
            }}>
                <div style={{ width: '100px', fontWeight: 900, color: 'var(--primary-color)', fontFamily: 'monospace' }}>
                    {entry.codigoDocumento}
                </div>
                <div style={{ flex: 1, fontWeight: 700 }}>
                    {entry.name}
                    <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>PROCESO: {entry.procesoCodigo} · SOPORTE: {entry.formatoSoporte}</div>
                </div>
                <div style={{ width: '200px' }}>
                    {template ? (
                        <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
                            <FileTextIcon size={12} style={{ opacity: 0.5 }} />
                            <span style={{ fontSize: '0.75rem' }}>{template.name.substring(0, 20)}...</span>
                        </div>
                    ) : <span style={{ fontSize: '0.7rem', opacity: 0.3 }}>SIN_PLANTILLA</span>}
                </div>
                <div style={{ width: '200px' }}>
                    {profile ? (
                        <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
                            <ShieldCheckIcon size={12} color="var(--status-ok)" />
                            <span style={{ fontSize: '0.75rem' }}>{profile.name.substring(0, 20)}...</span>
                        </div>
                    ) : <span style={{ fontSize: '0.7rem', opacity: 0.3 }}>SIN_GOLDEN</span>}
                </div>
                <div style={{ width: '100px', textAlign: 'center' }}>
                    <button 
                        className={`station-badge ${entry.isActive ? 'success' : 'warn'}`}
                        onClick={() => toggleStatus(entry)}
                        style={{ cursor: 'pointer', border: 'none' }}
                    >
                        {entry.isActive ? 'ACTIVO' : 'BAJA'}
                    </button>
                </div>
                <div style={{ width: '100px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="station-btn icon-only secondary tiny" onClick={() => {
                        setEditingEntry(entry);
                        setIsEditorOpen(true);
                    }} title="Editar"><EditIcon size={14}/></button>
                    <button className="station-btn icon-only secondary tiny" onClick={async () => {
                        if (confirm(`¿Eliminar código ${entry.codigoDocumento}?`)) {
                            await db.doc_catalog_v1.delete(entry.id);
                        }
                    }} title="Borrar"><TrashIcon size={14}/></button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-col" style={{ height: '100%', gap: '20px' }}>
            <header className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                    <div className="technical-icon-box" style={{ background: 'var(--primary-color)', color: 'black' }}>
                        <TagIcon size={20} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1rem', letterSpacing: '1px' }}>CATÁLOGO LOCAL DE DOCUMENTOS</h2>
                        <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>COORDINACIÓN HOST Xnnnnn · CATDOCUM STATION</span>
                    </div>
                </div>

                <div className="flex-row" style={{ gap: '16px' }}>
                    <div className="station-search-box" style={{ width: '300px' }}>
                        <SearchIcon size={14} style={{ opacity: 0.4 }} />
                        <input 
                            className="station-input-minimal" 
                            placeholder="BUSCAR CÓDIGO O NOMBRE..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="station-btn primary" onClick={() => {
                        setEditingEntry({ isActive: true, formatoSoporte: '04', procesoCodigo: 'CAH' });
                        setIsEditorOpen(true);
                    }}>
                        <PlusIcon size={16} /> NUEVO_DOC
                    </button>
                </div>
            </header>

            <div className="station-card flex-col" style={{ flex: 1, padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div className="station-table-header" style={{ 
                    display: 'flex', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', 
                    borderBottom: '1px solid var(--border-color)', fontSize: '0.65rem', fontWeight: 900, opacity: 0.6 
                }}>
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
                        containerHeight={600}
                        renderRow={renderRow}
                    />
                </div>
            </div>

            {isEditorOpen && (
                <div className="station-modal-overlay animate-fade-in" style={{ zIndex: 1000 }}>
                    <form className="station-modal-content station-card" style={{ maxWidth: '600px' }} onSubmit={handleSave}>
                        <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '24px' }}>
                           <h3 style={{ margin: 0, fontSize: '0.85rem', letterSpacing: '2px' }}>EDITOR CATDOCUM LOCAL</h3>
                           <button type="button" className="station-btn tiny secondary" onClick={() => setIsEditorOpen(false)}><XIcon size={16}/></button>
                        </div>

                        <div className="station-form-grid" style={{ marginBottom: '20px' }}>
                            <div className="station-form-field">
                                <label className="station-label">CÓDIGO_HOST (Xnnnnn)</label>
                                <input 
                                    className="station-input" 
                                    required 
                                    maxLength={6}
                                    placeholder="X00001"
                                    value={editingEntry?.codigoDocumento || ''}
                                    onChange={e => setEditingEntry({...editingEntry!, codigoDocumento: e.target.value})}
                                />
                            </div>
                            <div className="station-form-field">
                                <label className="station-label">PROCESO_VINCULADO</label>
                                <input 
                                    className="station-input" 
                                    placeholder="CAH, CAT, etc."
                                    value={editingEntry?.procesoCodigo || ''}
                                    onChange={e => setEditingEntry({...editingEntry!, procesoCodigo: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="station-form-field" style={{ marginBottom: '20px' }}>
                            <label className="station-label">NOMBRE DEL DOCUMENTO (DESCRIPTIVO)</label>
                            <input 
                                className="station-input" 
                                required 
                                placeholder="CARTA DE BIENVENIDA..."
                                value={editingEntry?.name || ''}
                                onChange={e => setEditingEntry({...editingEntry!, name: e.target.value})}
                            />
                        </div>

                        <div className="station-form-grid" style={{ marginBottom: '20px' }}>
                            <div className="station-form-field">
                                <label className="station-label">PLANTILLA LETTER</label>
                                <select 
                                    className="station-input"
                                    value={editingEntry?.defaultTemplateId || ''}
                                    onChange={e => setEditingEntry({...editingEntry!, defaultTemplateId: e.target.value})}
                                >
                                    <option value="">-- NINGUNA --</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="station-form-field">
                                <label className="station-label">PERFIL GOLDEN GAWEB</label>
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

                        <div className="station-form-grid">
                            <div className="station-form-field">
                                <label className="station-label">FORMATO_SOPORTE</label>
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
                            <div className="station-form-field flex-row" style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                                <label className="station-label flex-row" style={{ gap: '12px', cursor: 'pointer' }}>
                                    <span>ACTIVO_EN_ESTACIÓN</span>
                                    <input 
                                        type="checkbox" 
                                        checked={editingEntry?.isActive ?? true}
                                        onChange={e => setEditingEntry({...editingEntry!, isActive: e.target.checked})}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="flex-row" style={{ justifyContent: 'flex-end', marginTop: '32px', gap: '12px' }}>
                            <button type="button" className="station-btn secondary" onClick={() => setIsEditorOpen(false)}>CANCELAR</button>
                            <button type="submit" className="station-btn primary">GUARDAR_REGISTRO</button>
                        </div>
                    </form>
                </div>
            )}

            <style jsx>{`
                .station-search-box {
                    display: flex;
                    align-items: center;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid var(--border-color);
                    padding: 0 12px;
                    border-radius: 4px;
                    height: 36px;
                }
                .station-input-minimal {
                    background: transparent;
                    border: none;
                    color: white;
                    padding: 8px;
                    font-size: 0.75rem;
                    flex: 1;
                    outline: none;
                    text-transform: uppercase;
                }
                .station-table-header div {
                    letter-spacing: 0.5px;
                }
            `}</style>
        </div>
    );
};
