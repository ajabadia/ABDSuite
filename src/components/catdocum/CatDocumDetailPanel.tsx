/**
 * ABDFN Suite - CatDocum Detail Panel (Phase 19)
 * Industrial Master-Detail editor for the Document Catalog.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CatDocumRecord, DocChannel, DocSupport } from '@/lib/types/catdocum.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { SaveIcon, XIcon, PlusIcon } from '@/components/common/Icons';
import { EtlPreset } from '@/lib/types/etl.types';
import { LetterTemplate, LetterMapping } from '@/lib/types/letter.types';

interface CatDocumDetailPanelProps {
  record: CatDocumRecord | null;
  presets: EtlPreset[];
  templates: LetterTemplate[];
  mappings: LetterMapping[];
  onSave: (rec: CatDocumRecord) => Promise<void> | void;
  onCancel: () => void;
  onPreviewTemplate?: (templateId: string) => void;
  onPreviewDummy?: (record: CatDocumRecord) => void;
}

const CatDocumDetailPanel: React.FC<CatDocumDetailPanelProps> = ({
  record,
  presets,
  templates,
  mappings,
  onSave,
  onCancel,
  onPreviewTemplate,
  onPreviewDummy
}) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<CatDocumRecord | null>(record);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(record);
  }, [record]);

  if (!form) {
    return (
      <section className="station-card catdocum-detail-empty">
        <div className="empty-state-content">
          <p>{t('catdocum.selectHint') ?? 'SELECCIONE UN DOCUMENTO O CREE UNO NUEVO'}</p>
        </div>
      </section>
    );
  }

  const handleChange = <K extends keyof CatDocumRecord>(
    key: K,
    value: CatDocumRecord[K],
  ) => {
    setForm({ ...form!, [key]: value, updatedAt: Date.now() });
  };

  const handleSaveClick = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
      await onSave(form);
    } finally {
      setIsSaving(false);
    }
  };

  // Filters
  const templateOptions = templates.filter((t) => t.isActive !== false);
  const mappingOptions = mappings.filter((m) =>
    form.templateId ? m.templateId === form.templateId : true,
  );
  
  const channelOptions: DocChannel[] = ['GAWEB', 'BATCH', 'ONDEMAND'];
  const supportOptions: DocSupport[] = ['PDF', 'DOCX', 'HTML'];

  return (
    <section className="station-card catdocum-detail obsidian-surface-technical">
      <header className="detail-header">
        <div className="title-group">
          <h3 className="technical-title">{form.codDocumento || 'NEW DOC'}</h3>
          <span className="subtitle">
            {(form.businessName || t('catdocum.noname')) ?? 'SIN NOMBRE DE NEGOCIO'}
          </span>
        </div>
        <div className="actions">
          <button
            className="station-btn secondary icon-only"
            onClick={onCancel}
            title={t('common.cancel')}
          >
            <XIcon size={16} />
          </button>
          <button
            className="station-btn primary"
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            <SaveIcon size={16} />
            <span style={{ marginLeft: 8 }}>
              {isSaving ? '...' : t('common.save') ?? 'GUARDAR'}
            </span>
          </button>
        </div>
      </header>

      <div className="detail-grid">
        {/* Identificación */}
        <div className="field">
          <label>CÓDIGO HOST (CODDOC)</label>
          <input
            className="station-input"
            maxLength={6}
            value={form.codDocumento}
            onChange={(e) =>
              handleChange('codDocumento', e.target.value.toUpperCase())
            }
            placeholder="X00000"
          />
        </div>

        <div className="field">
          <label>NOMBRE DE NEGOCIO</label>
          <input
            className="station-input"
            value={form.businessName}
            onChange={(e) =>
              handleChange('businessName', e.target.value)
            }
          />
        </div>

        <div className="field">
          <label>CATEGORÍA FUNCIONAL</label>
          <input
            className="station-input"
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="ALTA, BAJA, CAMBIO_COND, LEGAL..."
          />
        </div>

        {/* Canal / soporte */}
        <div className="field">
          <label>CANAL DE COMUNICACIÓN</label>
          <select
            className="station-select"
            value={form.channel}
            onChange={(e) =>
              handleChange('channel', e.target.value as DocChannel)
            }
          >
            {channelOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>SOPORTE PRINCIPAL</label>
          <select
            className="station-select"
            value={form.support}
            onChange={(e) =>
              handleChange('support', e.target.value as DocSupport)
            }
          >
            {supportOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>IDIOMA ISO</label>
          <input
            className="station-input"
            value={form.languageIso ?? ''}
            onChange={(e) =>
              handleChange('languageIso', e.target.value || null)
            }
            placeholder="es-ES"
          />
        </div>

        <div className="field">
          <label>PÁGINAS DEFECTO</label>
          <input
            className="station-input"
            type="number"
            value={form.pagesDefault ?? ''}
            onChange={(e) =>
              handleChange(
                'pagesDefault',
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </div>

        <div className="field checkbox" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', paddingTop: '12px' }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            id="is-active-check"
          />
          <label htmlFor="is-active-check" style={{ marginBottom: 0, cursor: 'pointer' }}>VISIBLE EN CATÁLOGO</label>
        </div>

        <div className="divider full" />

        {/* Relaciones: preset, plantilla, mapping */}
        <div className="field full">
          <label>PRESET ETL ASOCIADO (INPUT DATA)</label>
          <select
            className="station-select"
            value={form.presetId ?? ''}
            onChange={(e) =>
              handleChange('presetId', e.target.value || null)
            }
          >
            <option value="">-- SIN PRESET --</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.gawebConfig?.codigoDocumento ?? 'N/A'})
              </option>
            ))}
          </select>
        </div>

        <div className="field full">
          <label>PLANTILLA ASOCIADA (LAYOUT)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="station-select"
              style={{ flex: 1 }}
              value={form.templateId ?? ''}
              onChange={(e) =>
                handleChange('templateId', e.target.value || null)
              }
            >
              <option value="">-- SIN PLANTILLA --</option>
              {templateOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} [{t.type}]
                </option>
              ))}
            </select>
            {form.templateId && onPreviewTemplate && (
               <button
                 type="button"
                 className="station-btn secondary icon-only"
                 onClick={() => onPreviewTemplate(form.templateId!)}
                 title="VER PLANTILLA"
               >
                 <PlusIcon size={14} />
               </button>
            )}
          </div>
        </div>

        <div className="field full">
          <label>MAPPING ASOCIADO (LOGIC)</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className="station-select"
              style={{ flex: 1 }}
              value={form.mappingId ?? ''}
              onChange={(e) =>
                handleChange('mappingId', e.target.value || null)
              }
            >
              <option value="">-- SIN MAPPING --</option>
              {mappingOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || `Mapping ${m.id?.substring(0,8)}`}
                </option>
              ))}
            </select>
            {form.templateId && form.mappingId && onPreviewDummy && (
               <button
                 type="button"
                 className="station-btn secondary"
                 style={{ fontSize: '0.65rem', padding: '0 8px' }}
                 onClick={() => onPreviewDummy(form)}
               >
                 DUMMY PREVIEW
               </button>
            )}
          </div>
        </div>

        <div className="field full">
          <label>OBSERVACIONES / AYUDA FUNCIONAL</label>
          <textarea
            className="station-input"
            rows={3}
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            style={{ resize: 'vertical', minHeight: '60px' }}
          />
        </div>

        <div className="field full">
          <div className="dummy-legend">
            <strong>PREVIEW DUMMY:</strong> Esta funcionalidad genera un documento de prueba inyectando valores sintéticos basados en los nombres de los placeholders. Útil para verificar saltos de línea y maquetación sin exponer datos de clientes.
          </div>
        </div>
      </div>

      <style jsx>{`
        .catdocum-detail {
          display: flex;
          flex-direction: column;
          height: 100%;
          animation: fadeIn 0.3s ease-out;
        }
        .catdocum-detail-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          border: 1px dashed var(--border-color);
          background: rgba(15, 23, 42, 0.2);
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }
        .title-group {
          display: flex;
          flex-direction: column;
        }
        .technical-title {
          margin: 0;
          font-size: 1.1rem;
          letter-spacing: 2px;
          color: var(--primary-color);
        }
        .subtitle {
          font-size: 0.7rem;
          opacity: 0.6;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .actions {
          display: flex;
          gap: 12px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 20px;
          overflow-y: auto;
          padding-right: 8px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field.full {
          grid-column: 1 / -1;
        }
        .field label {
          font-size: 0.6rem;
          letter-spacing: 1px;
          opacity: 0.5;
          text-transform: uppercase;
          font-weight: 700;
        }
        .divider {
          height: 1px;
          background: var(--border-color);
          margin: 12px 0;
          opacity: 0.5;
        }
        .dummy-legend {
          font-size: 0.65rem;
          line-height: 1.5;
          opacity: 0.7;
          border: 1px dashed var(--border-color);
          padding: 12px;
          border-radius: 4px;
          background: rgba(2, 132, 199, 0.05);
          color: var(--text-secondary);
        }
        .dummy-legend strong {
          color: var(--primary-color);
          font-weight: 800;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default CatDocumDetailPanel;
