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
          className: 'station-badge success',
          label: 'VALID'
        };
      case 'EXEMPTED':
        return { 
          className: 'station-badge info',
          label: 'EXEMPT'
        };
      case 'MISMATCH':
        return { 
          className: 'station-badge warn',
          label: 'MISMATCH'
        };
      case 'INVALID':
        return { 
          className: 'station-badge err',
          label: 'INVALID'
        };
      default:
        return { 
          className: 'station-badge',
          label: 'N/A'
        };
    }
  };

  const config = getStyles(status);

  return (
    <span className={`${config.className} ${tiny ? 'tiny' : ''}`} style={{
      fontWeight: 900,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }}>
      {config.label}
    </span>
  );
};
