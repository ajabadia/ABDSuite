/**
 * ABDFN Suite - CatDocum Detail Panel (Phase 19)
 * Industrial Master-Detail editor for the Document Catalog.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CatDocumRecord, DocChannel, DocSupport } from '@/lib/types/catdocum.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { SaveIcon, XIcon, PlusIcon, EyeIcon } from '@/components/common/Icons';
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
          <p>{t('letter.catdocum.selectHint') ?? 'SELECCIONE UN DOCUMENTO OR CREE UNO NUEVO'}</p>
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
    <section className="station-card flex-col animate-fade-in" style={{ gap: '20px', padding: '0', overflow: 'hidden' }}>
      <header className="station-registry-header" style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex-col" style={{ gap: '4px' }}>
          <h3 className="station-registry-item-name" style={{ margin: 0, fontWeight: 900 }}>{form.codDocumento || 'DOC_NEW'}</h3>
          <span style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: 700 }}>
            {(form.businessName || t('letter.catdocum.noname'))?.toUpperCase()}
          </span>
        </div>
        <div className="flex-row" style={{ gap: '12px' }}>
          <button
            className="station-btn secondary icon-only"
            onClick={onCancel}
            title={t('common.cancel')}
          >
            <XIcon size={16} />
          </button>
          <button
            className="station-btn success"
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            <SaveIcon size={16} />
            <span style={{ marginLeft: 8 }}>
              {isSaving ? '...' : t('common.save').toUpperCase()}
            </span>
          </button>
        </div>
      </header>

      <div className="flex-col" style={{ flex: 1, overflowY: 'auto', padding: '24px', gap: '24px' }}>
        <div className="station-form-grid">
          {/* Identificación */}
          <div className="station-form-field">
            <label className="station-label">CÓDIGO HOST (CODDOC)</label>
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

          <div className="station-form-field">
            <label className="station-label">NOMBRE DE NEGOCIO</label>
            <input
              className="station-input"
              value={form.businessName}
              onChange={(e) =>
                handleChange('businessName', e.target.value)
              }
            />
          </div>

          <div className="station-form-field">
            <label className="station-label">CATEGORÍA FUNCIONAL</label>
            <input
              className="station-input"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="ALTA, BAJA, CAMBIO_COND, LEGAL..."
            />
          </div>

          {/* Canal / soporte */}
          <div className="station-form-field">
            <label className="station-label">CANAL DE COMUNICACIÓN</label>
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

          <div className="station-form-field">
            <label className="station-label">{t('letter.catdocum.fields.support')}</label>
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

          <div className="station-form-field">
            <label className="station-label">{t('letter.catdocum.fields.language')}</label>
            <input
              className="station-input"
              value={form.languageIso ?? ''}
              onChange={(e) =>
                handleChange('languageIso', e.target.value || null)
              }
              placeholder="es-ES"
            />
          </div>

          <div className="station-form-field">
            <label className="station-label">{t('letter.catdocum.fields.pages')}</label>
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

          <div className="station-form-field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', paddingTop: '12px' }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              id="is-active-check"
            />
            <label className="station-label" htmlFor="is-active-check" style={{ marginBottom: 0, cursor: 'pointer' }}>{t('letter.catdocum.fields.active')}</label>
          </div>

          <div className="station-form-divider" style={{ gridColumn: 'span 2' }} />

          {/* Relaciones: preset, plantilla, mapping */}
          <div className="station-form-field" style={{ gridColumn: 'span 2' }}>
            <label className="station-label">{t('letter.catdocum.fields.preset')}</label>
            <select
              className="station-select"
              value={form.presetId ?? ''}
              onChange={(e) =>
                handleChange('presetId', e.target.value || null)
              }
            >
              <option value="">{t('letter.catdocum.fields.none')}</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.gawebConfig?.codigoDocumento ?? 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div className="station-form-field" style={{ gridColumn: 'span 2' }}>
            <label className="station-label">{t('letter.catdocum.fields.template')}</label>
            <div className="flex-row" style={{ gap: '8px' }}>
              <select
                className="station-select"
                style={{ flex: 1 }}
                value={form.templateId ?? ''}
                onChange={(e) =>
                  handleChange('templateId', e.target.value || null)
                }
              >
                <option value="">{t('letter.catdocum.fields.none')}</option>
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
                   <EyeIcon size={14} />
                 </button>
              )}
            </div>
          </div>

          <div className="station-form-field" style={{ gridColumn: 'span 2' }}>
            <label className="station-label">{t('letter.catdocum.fields.mapping')}</label>
            <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
              <select
                className="station-select"
                style={{ flex: 1 }}
                value={form.mappingId ?? ''}
                onChange={(e) =>
                  handleChange('mappingId', e.target.value || null)
                }
              >
                <option value="">{t('letter.catdocum.fields.none')}</option>
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
                   style={{ fontSize: '0.65rem', padding: '0 8px', height: '32px' }}
                   onClick={() => onPreviewDummy(form)}
                 >
                   {t('letter.catdocum.fields.dummy_run')}
                 </button>
              )}
            </div>
          </div>

          <div className="station-form-field" style={{ gridColumn: 'span 2' }}>
            <label className="station-label">{t('letter.catdocum.fields.notes')}</label>
            <textarea
              className="station-input"
              rows={3}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              style={{ resize: 'vertical', minHeight: '60px' }}
            />
          </div>

          <div className="station-form-field" style={{ gridColumn: 'span 2' }}>
            <div className="alert-box info" style={{ fontSize: '0.7rem' }}>
              <strong style={{ color: 'var(--primary-color)' }}>PREVIEW DUMMY:</strong> Esta funcionalidad genera un documento de prueba inyectando valores sintéticos basados en los nombres de los placeholders. Útil para verificar saltos de línea y maquetación sin exponer datos de clientes.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CatDocumDetailPanel;
