'use client';

import React from 'react';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useLanguage } from '@/lib/context/LanguageContext';

interface StationHeaderProps {
  moduleName?: string;
  activeTabId?: string;
  onTabChange?: (id: string) => void;
  tabs?: {
    id: string;
    label: string;
    icon: React.ReactNode;
    subLabel?: string; // Optional custom sub-label
    active?: boolean;
    onClick?: () => void;
  }[];
  actions?: React.ReactNode;
  rightElement?: React.ReactNode;
  engineId: string;
  // Overrides
  title?: string;
  icon?: React.ReactNode;
}

export const StationHeader: React.FC<StationHeaderProps> = ({ 
  moduleName,
  activeTabId,
  onTabChange,
  tabs,
  actions,
  rightElement,
  engineId,
  title,
  icon
}) => {
   const { isLocked } = useWorkspace();
  const { t } = useLanguage();
  
  // Resolve active tab info
  const activeTab = tabs?.find(t => t.active || t.id === activeTabId);
  const displayTitle = title || activeTab?.label || moduleName || 'STATION';
  const displayIcon = icon || activeTab?.icon;

  return (
    <header className="station-panel-header" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px',
      padding: '24px 0',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '32px'
    }}>
      <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div className="flex-row" style={{ alignItems: 'center', gap: '16px' }}>
          {displayIcon && (
            <div className="station-icon-box" style={{ 
              color: 'var(--primary-color)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              opacity: 0.8
            }}>
              {React.cloneElement(displayIcon as any, { size: 28 })}
            </div>
          )}
          <div className="flex-col" style={{ gap: '4px' }}>
            <h2 className="station-title-main" style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: 900, 
              letterSpacing: '0.1rem' 
            }}>
              {displayTitle.toUpperCase()}
            </h2>
            <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
               <span style={{ opacity: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>{t('station_header.engine')}: {engineId.toUpperCase()}</span>
               <span className="station-badge info">{t('station_header.secure_context')}</span>
               <span className={`station-badge ${isLocked ? 'warn' : 'success'}`}>
                  {isLocked ? t('station_header.vault_locked') : t('station_header.vault_open')}
               </span>
            </div>
          </div>
        </div>

        <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
            {actions && (
              <div className="flex-row" style={{ gap: '8px' }}>
                {actions}
              </div>
            )}
            {rightElement}
        </div>
      </div>

      {tabs && tabs.length > 0 && (
        <nav className="wizard-nav" style={{ 
          border: '1px solid var(--border-color)',
          background: 'var(--surface-color)',
          borderRadius: '4px',
          overflow: 'hidden',
          display: 'flex',
          width: '100%'
        }}>
          {tabs.map(tab => {
            const isActive = tab.active || tab.id === activeTabId;
            return (
                <button 
                  key={tab.id}
                  className={`wizard-step-btn ${isActive ? 'active' : ''}`} 
                  onClick={() => {
                    if (tab.onClick) tab.onClick();
                    if (onTabChange) onTabChange(tab.id);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    border: 'none',
                    borderRight: '1px solid var(--border-color)',
                    background: isActive ? 'rgba(var(--primary-color-rgb), 0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: '70px',
                    position: 'relative',
                    boxShadow: isActive ? 'inset 0 -3px 0 var(--primary-color)' : 'none'
                  }}
                >
                  <span className="wizard-step-id" style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: 800, 
                    color: 'var(--primary-color)',
                    letterSpacing: '0.1rem',
                    opacity: isActive ? 1 : 0.6
                  }}>
                    {tab.id.toUpperCase()}
                  </span>
                  <span className="wizard-step-label" style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 900, 
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      right: '8px', 
                      color: 'var(--primary-color)',
                      opacity: 0.5
                    }}>
                      {tab.icon && React.cloneElement(tab.icon as any, { size: 10 })}
                    </div>
                  )}
                </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
