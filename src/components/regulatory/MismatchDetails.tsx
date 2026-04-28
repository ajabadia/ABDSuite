import React from 'react';
import { AlertTriangleIcon } from '@/components/common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';

interface MismatchDetailsProps {
  reasonCode?: string;
  fields?: string[];
}

/**
 * Mismatch Details Component (Aseptic v6)
 * Renders a visual tree of biographic inconsistencies.
 */
export const MismatchDetails: React.FC<MismatchDetailsProps> = ({
  reasonCode,
  fields,
}) => {
  const { t } = useLanguage();
  if (!fields || fields.length === 0) return null;

  const mapFieldLabel = (field: string) => {
    const key = `regulatory.fields.${field}`;
    const localized = t(key as any);
    if (localized !== key) return localized.toUpperCase();
    
    switch (field) {
      case 'dob': return 'DATE_OF_BIRTH';
      case 'gender': return 'GENDER_IDENTITY';
      case 'city': return 'TOWN_OF_BIRTH';
      case 'name': return 'LEGAL_NAME_SEQ';
      default: return field.toUpperCase();
    }
  };

  return (
    <div
      className="station-card"
      style={{
        marginTop: '12px',
        padding: '16px',
        borderLeft: '4px solid var(--status-warn)',
        background: 'rgba(251, 146, 60, 0.05)',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 900,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--status-warn)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <AlertTriangleIcon size={14} />
        {t('regulatory.stat_mismatch').toUpperCase()}_DETECTED
      </div>
      
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {fields.map(field => (
          <li
            key={field}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <div style={{ marginTop: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-warn)' }} />
            </div>
            <div className="flex-col">
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white', opacity: 0.9 }}>
                {mapFieldLabel(field)}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '2px', lineHeight: 1.4 }}>
                {t(`regulatory.mismatch_hints.${field}` as any) !== `regulatory.mismatch_hints.${field}` 
                    ? t(`regulatory.mismatch_hints.${field}` as any)
                    : 'INCONSISTENCY_DETECTED_IN_CORE_LOGIC'}
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      {reasonCode && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: '0.55rem',
            opacity: 0.4,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.5px'
          }}
        >
          INTERNAL_REASON_CODE: <span style={{ color: 'var(--status-warn)', fontWeight: 900 }}>{reasonCode}</span>
        </div>
      )}
    </div>
  );
};
