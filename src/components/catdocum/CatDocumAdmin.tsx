/**
 * ABDFN Suite - CatDocum Administration (Phase 19)
 * Central management hub for the Document Catalog.
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { CatDocumRecord } from '@/lib/types/catdocum.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useRendererEngine } from '@/components/common/useRendererEngine';
import { docxFillEngine } from '@/lib/services/docxFillEngine';
import { guessLogicalType, generateDummyValue } from '@/lib/logic/dummy-values.logic';

import {
  SearchIcon,
  PlusIcon,
  FileTextIcon,
  EyeIcon,
  FilterIcon,
  ActivityIcon
} from '@/components/common/Icons';

import CatDocumDetailPanel from './CatDocumDetailPanel';

const CatDocumAdmin: React.FC = () => {
  const { t } = useLanguage();
  const renderer = useRendererEngine();
  
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<CatDocumRecord | null>(null);

  // Data Fetching
  const records = useLiveQuery(() => db.catdocumv6.orderBy('codDocumento').toArray(), []);
  const presets = useLiveQuery(() => db.presets_v6.toArray(), []);
  const templates = useLiveQuery(() => db.lettertemplates_v6.toArray(), []);
  const mappings = useLiveQuery(() => db.lettermappings_v6.toArray(), []);

  // Filter Logic
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q || !records) return records ?? [];
    return records.filter((r: CatDocumRecord) => {
      const cod = (r.codDocumento || '').toLowerCase();
      const name = (r.businessName || '').toLowerCase();
      const cat = (r.category || '').toLowerCase();
      return cod.includes(q) || name.includes(q) || cat.includes(q);
    });
  }, [filter, records]);

  // Selection Logic
  useEffect(() => {
    if (!selectedId) {
      setEditing(null);
      return;
    }
    const rec = records?.find((r: CatDocumRecord) => r.id === selectedId) ?? null;
    setEditing(rec);
  }, [selectedId, records]);

  // Handlers
  const handleCreateNew = () => {
    const now = Date.now();
    const draft: CatDocumRecord = {
      id: crypto.randomUUID(),
      codDocumento: '',
      businessName: '',
      category: '',
      channel: 'GAWEB',
      support: 'PDF',
      templateId: null,
      mappingId: null,
      presetId: null,
      languageIso: 'es-ES',
      pagesDefault: 1,
      isActive: true,
      isDefaultForCode: false,
      notes: '',
      version: '1.0',
      createdAt: now,
      updatedAt: now,
    };
    setSelectedId(draft.id);
    setEditing(draft);
  };

  const handleSaveRecord = async (rec: CatDocumRecord) => {
    try {
      await db.catdocumv6.put(rec);
      setSelectedId(rec.id);
    } catch (err) {
      console.error('[CATDOCUM_ADMIN] Save failed:', err);
      alert('Error al guardar el registro del catálogo.');
    }
  };

  const handlePreviewTemplate = async (templateId: string) => {
    if (!renderer) {
      alert(t('letter.renderer_not_ready') || 'VISOR DE ALTA FIDELIDAD NO INICIALIZADO');
      return;
    }
    
    const tmpl = await db.lettertemplates_v6.get(templateId);
    if (!tmpl) {
      alert('Plantilla no encontrada.');
      return;
    }

    let blob: Blob;
    let filename = tmpl.name || 'TEMPLATE';
    
    if (tmpl.type === 'DOCX' && tmpl.binaryContent) {
      blob = new Blob([tmpl.binaryContent], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      if (!filename.toLowerCase().endsWith('.docx')) filename += '.docx';
    } else {
      blob = new Blob([tmpl.content ?? ''], { type: 'text/html' });
      if (!filename.toLowerCase().endsWith('.html')) filename += '.html';
    }

    try {
      const pdfBlob = await renderer.renderToPdf(blob, filename);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('[CATDOCUM_ADMIN] Preview failed:', err);
      alert('Error al procesar la previsualización de alta fidelidad.');
    }
  };

  const handlePreviewDummy = async (catDoc: CatDocumRecord) => {
    if (!renderer) {
      alert('VISOR NO DISPONIBLE');
      return;
    }
    if (!catDoc.templateId || !catDoc.mappingId) {
      alert('Se requiere plantilla y mapping para previsualización sintética.');
      return;
    }

    const [tmpl, mapping] = await Promise.all([
      db.lettertemplates_v6.get(catDoc.templateId),
      db.lettermappings_v6.get(catDoc.mappingId),
    ]);

    if (!tmpl || tmpl.type !== 'DOCX' || !tmpl.binaryContent || !mapping) {
      alert('Solo se admite previsualización sintética para plantillas DOCX con mapping válido.');
      return;
    }

    // Generate Dummy Data
    const dummyData: Record<string, any> = {};
    for (const m of mapping.mappings) {
      const key = m.templateVar;
      if (!key || dummyData[key] !== undefined) continue;
      
      const type = guessLogicalType(key);
      dummyData[key] = generateDummyValue(type, key);
    }

    try {
      // 1. Fill DOCX
      const filledDocx = await docxFillEngine.fillTemplate(tmpl.binaryContent, dummyData);
      
      // 2. Render to PDF
      const pdfBlob = await renderer.renderToPdf(
        filledDocx, 
        `${catDoc.codDocumento || 'DOC'}-DUMMY.docx`
      );
      
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('[CATDOCUM_ADMIN] Dummy preview failed:', err);
      alert('Fallo en la generación del documento sintético.');
    }
  };

  return (
    <div className="catdocum-layout">
      {/* Listado Maestro */}
      <section className="station-card catdocum-list obsidian-surface-technical">
        <header className="catdocum-header">
          <div className="title-group">
            <h3 className="technical-title">{t('catdocum.master_list') ?? 'CATÁLOGO DE DOCUMENTOS'}</h3>
            <span className="badge">
              {filtered.length} {t('catdocum.entries') ?? 'ENTRADAS'}
            </span>
          </div>
          <div className="actions">
            <button
              className="station-btn icon-only primary-glow"
              onClick={handleCreateNew}
              title={t('catdocum.new_entry') ?? 'NUEVA ENTRADA'}
            >
              <PlusIcon size={18} />
            </button>
          </div>
        </header>

        <div className="search-row">
          <div className="input-wrapper">
            <SearchIcon size={14} className="input-icon" />
            <input
              className="station-input search-input"
              placeholder={t('common.search') ?? 'BUSCAR POR CODDOC O NOMBRE'}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="station-table technical-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>CODDOC</th>
                <th>{t('catdocum.table.name') ?? 'NOMBRE NEGOCIO'}</th>
                <th style={{ width: '100px' }}>{t('catdocum.table.category') ?? 'CATEGORÍA'}</th>
                <th style={{ width: '80px' }}>{t('catdocum.table.status') ?? 'ESTADO'}</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-message">
                    {t('catdocum.empty_list') ?? 'NO HAY DOCUMENTOS CONFIGURADOS'}
                  </td>
                </tr>
              )}
              {filtered.map((r: CatDocumRecord) => (
                <tr
                  key={r.id}
                  className={`technical-row ${selectedId === r.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <td className="technical-code">{r.codDocumento}</td>
                  <td>
                    <div className="name-cell">
                      <FileTextIcon size={14} className="cell-icon" />
                      <span>{r.businessName || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="category-tag">{r.category}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${r.isActive ? 'active' : 'inactive'}`}>
                      {r.isActive ? 'ACTIVE' : 'HIDDEN'}
                    </span>
                  </td>
                  <td>
                    {r.templateId && (
                      <button
                        className="station-btn tiny icon-only ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewTemplate(r.templateId!);
                        }}
                      >
                        <EyeIcon size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalle / Edición */}
      <CatDocumDetailPanel
        record={editing}
        presets={presets ?? []}
        templates={templates ?? []}
        mappings={mappings ?? []}
        onSave={handleSaveRecord}
        onCancel={() => setSelectedId(null)}
        onPreviewTemplate={handlePreviewTemplate}
        onPreviewDummy={handlePreviewDummy}
      />

      <style jsx>{`
        .catdocum-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          height: calc(100vh - 180px);
          animation: slideUp 0.4s ease-out;
        }
        .catdocum-list {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .catdocum-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .technical-title {
          font-size: 0.85rem;
          letter-spacing: 2px;
          opacity: 0.8;
          margin: 0;
        }
        .badge {
          font-size: 0.6rem;
          opacity: 0.4;
          margin-top: 4px;
          display: block;
        }
        .search-row {
          margin-bottom: 16px;
        }
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.4;
        }
        .search-input {
          padding-left: 36px;
          width: 100%;
          background: rgba(15, 23, 42, 0.4);
        }
        .table-container {
          flex: 1;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: rgba(15, 23, 42, 0.2);
        }
        .technical-table th {
          position: sticky;
          top: 0;
          background: var(--surface-secondary);
          z-index: 10;
          font-size: 0.6rem;
          letter-spacing: 1px;
          padding: 12px;
        }
        .technical-row {
          cursor: pointer;
          transition: all 0.2s;
        }
        .technical-row:hover {
          background: rgba(2, 132, 199, 0.1);
        }
        .technical-row.active {
          background: rgba(2, 132, 199, 0.15);
          border-left: 3px solid var(--primary-color);
        }
        .technical-code {
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--primary-color);
          font-size: 0.75rem;
        }
        .name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.75rem;
        }
        .cell-icon {
          opacity: 0.5;
        }
        .category-tag {
          font-size: 0.6rem;
          padding: 2px 6px;
          background: rgba(148, 163, 184, 0.1);
          border-radius: 2px;
          opacity: 0.8;
        }
        .status-pill {
          font-size: 0.55rem;
          padding: 2px 6px;
          border-radius: 99px;
          font-weight: 700;
        }
        .status-pill.active {
          color: var(--success-color);
          background: rgba(34, 197, 94, 0.1);
        }
        .status-pill.inactive {
          color: var(--text-tertiary);
          background: rgba(148, 163, 184, 0.1);
        }
        .empty-message {
          text-align: center;
          padding: 48px 0;
          opacity: 0.4;
          font-size: 0.8rem;
          font-style: italic;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CatDocumAdmin;
