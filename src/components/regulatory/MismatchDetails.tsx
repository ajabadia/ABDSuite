import React from 'react';
import { AlertTriangleIcon } from '@/components/common/Icons';

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
  if (!fields || fields.length === 0) return null;

  const mapFieldLabel = (field: string) => {
    switch (field) {
      case 'dob': return 'DATE_OF_BIRTH';
      case 'gender': return 'GENDER_IDENTITY';
      case 'city': return 'TOWN_OF_BIRTH';
      case 'name': return 'LEGAL_NAME_SEQ';
      default: return field.toUpperCase();
    }
  };

  const mapFieldHint = (field: string) => {
    switch (field) {
      case 'dob': return 'The birth date provided does not match the encoded value within the TIN.';
      case 'gender': return 'Biological sex encoded in the TIN contradicts the user input.';
      case 'city': return 'The cadastral place/city code in the TIN is inconsistent with the provided city.';
      default: return 'Metadata value is inconsistent with the jurisdictional logic of the TIN.';
    }
  };

  return (
    <div
      className="station-card"
      style={{
        marginTop: '12px',
        padding: '16px',
        borderLeft: '4px solid #fb923c',
        background: 'rgba(251, 146, 60, 0.05)',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 900,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#fb923c',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <AlertTriangleIcon size={14} />
        SEMANTIC_DISCREPANCY_DETECTED
      </div>
      
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {fields.map(field => (
          <li
            key={field}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            <div style={{ marginTop: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fb923c' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white', opacity: 0.9 }}>
                {mapFieldLabel(field)}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '2px', lineHeight: 1.4 }}>
                {mapFieldHint(field)}
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
            fontSize: '0.6rem',
            opacity: 0.4,
            fontFamily: 'var(--font-roboto-mono)',
          }}
        >
          INTERNAL_REASON_CODE: <span style={{ color: '#fb923c' }}>{reasonCode}</span>
        </div>
      )}
    </div>
  );
};
