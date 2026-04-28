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
    <div className="flex-col animate-fade-in" style={{ gap: '24px', height: '100%' }}>
      <div className="catdocum-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Listado Maestro */}
        <section className="station-card flex-col" style={{ gap: '20px', padding: '0', overflow: 'hidden' }}>
          <header className="station-registry-header" style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex-col" style={{ gap: '4px' }}>
              <h3 className="station-registry-item-name" style={{ margin: 0, fontWeight: 900 }}>{t('letter.catdocum.master_list') ?? 'CATÁLOGO DE DOCUMENTOS'}</h3>
              <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                <span className="station-badge info" style={{ fontSize: '0.65rem' }}>{filtered.length} {t('letter.catdocum.entries') ?? 'ENTRADAS'}</span>
              </div>
            </div>
            <div className="flex-row" style={{ gap: '12px' }}>
              <button
                className="station-btn success icon-only"
                onClick={handleCreateNew}
                title={t('letter.catdocum.new_entry') ?? 'NUEVA ENTRADA'}
              >
                <PlusIcon size={18} />
              </button>
            </div>
          </header>

          <div style={{ padding: '16px 24px' }}>
            <div className="station-form-field" style={{ margin: 0 }}>
              <div className="flex-row" style={{ gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <SearchIcon size={14} style={{ opacity: 0.4 }} />
                <input
                  className="station-input-clean"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  placeholder={t('common.search') ?? 'BUSCAR POR CODDOC O NOMBRE'}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="station-table-container" style={{ flex: 1, margin: '0 24px 24px 24px' }}>
            <table className="station-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>{t('letter.catdocum.table.code') ?? 'CODDOC'}</th>
                  <th>{t('letter.catdocum.table.name') ?? 'NOMBRE NEGOCIO'}</th>
                  <th style={{ width: '100px' }}>{t('letter.catdocum.table.category') ?? 'CATEGORÍA'}</th>
                  <th style={{ width: '80px' }}>{t('letter.catdocum.table.status') ?? 'ESTADO'}</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                      {t('letter.catdocum.empty_list') ?? 'NO HAY DOCUMENTOS CONFIGURADOS'}
                    </td>
                  </tr>
                )}
                {filtered.map((r: CatDocumRecord) => (
                  <tr
                    key={r.id}
                    className={selectedId === r.id ? 'active' : ''}
                    onClick={() => setSelectedId(r.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 900, color: 'var(--primary-color)', fontFamily: 'var(--font-mono)' }}>{r.codDocumento}</td>
                    <td>
                      <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                        <FileTextIcon size={14} style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{r.businessName || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="station-badge info" style={{ fontSize: '0.6rem' }}>{r.category}</span>
                    </td>
                    <td>
                      <span className={`station-badge ${r.isActive ? 'success' : 'warn'}`} style={{ fontSize: '0.6rem' }}>
                        {r.isActive ? 'ACTIVE' : 'HIDDEN'}
                      </span>
                    </td>
                    <td>
                      {r.templateId && (
                        <button
                          className="station-btn icon-only secondary"
                          style={{ padding: '4px' }}
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
      </div>
    </div>
  );
};

export default CatDocumAdmin;
