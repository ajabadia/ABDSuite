import React from 'react';
import { TinValidationStatus } from '@/lib/types/regulatory.types';

interface TinStatusBadgeProps {
  status: TinValidationStatus;
  tiny?: boolean;
}

/**
 * Industrial Status Badge (ABDFN Design System - Era 6)
 */
export const TinStatusBadge: React.FC<TinStatusBadgeProps> = ({ status, tiny }) => {
  const getStyles = (s: TinValidationStatus) => {
    switch (s) {
      case 'VALID':
        return { 
          bg: 'rgba(16, 185, 129, 0.12)', 
          border: 'rgba(16, 185, 129, 0.5)', 
          color: '#10b981',
          label: 'VALID'
        };
      case 'EXEMPTED':
        return { 
          bg: 'rgba(56, 189, 248, 0.12)', 
          border: 'rgba(56, 189, 248, 0.5)', 
          color: '#38bdf8',
          label: 'EXEMPT'
        };
      case 'MISMATCH':
        return { 
          bg: 'rgba(251, 146, 60, 0.12)', 
          border: 'rgba(251, 146, 60, 0.5)', 
          color: '#fb923c',
          label: 'MISMATCH'
        };
      case 'INVALID':
        return { 
          bg: 'rgba(244, 63, 94, 0.12)', 
          border: 'rgba(244, 63, 94, 0.5)', 
          color: '#f43f5e',
          label: 'INVALID'
        };
      default:
        return { 
          bg: 'rgba(155, 155, 155, 0.1)', 
          border: 'rgba(155, 155, 155, 0.3)', 
          color: '#999',
          label: 'N/A'
        };
    }
  };

  const config = getStyles(status);

  return (
    <span className="tin-badge" style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: tiny ? '1px 6px' : '2px 10px',
      borderRadius: '999px',
      fontSize: tiny ? '0.55rem' : '0.65rem',
      fontWeight: 900,
      letterSpacing: '0.08em',
      background: config.bg,
      border: `1px solid ${config.border}`,
      color: config.color,
      textTransform: 'uppercase'
    }}>
      {config.label}
    </span>
  );
};
