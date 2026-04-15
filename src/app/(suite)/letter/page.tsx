'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';

import LetterStation from '@/components/LetterStation/LetterStation';
import TemplateEditor from '@/components/LetterStation/TemplateEditor';
import MappingMatrix from '@/components/LetterStation/MappingMatrix';

export default function LetterPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'templates' | 'mapping' | 'generation'>('generation');

  return (
    <main className="module-container">
      <header className="module-header glass">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
          <h1 className="module-title" style={{ fontSize: '1.8rem' }}>
            {t('shell.letter').toUpperCase()}
          </h1>
          <span className="terminal-prompt" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            A:\ABDFN\LETTER_STATION&gt;
          </span>
        </div>
        <div className="tab-group" style={{ marginLeft: 'auto', display: 'flex', gap: '1px', background: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
          <button 
            className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            1_PLANTILLAS
          </button>
          <button 
            className={`tab-btn ${activeTab === 'mapping' ? 'active' : ''}`}
            onClick={() => setActiveTab('mapping')}
          >
            2_MAPEADO
          </button>
          <button 
            className={`tab-btn ${activeTab === 'generation' ? 'active' : ''}`}
            onClick={() => setActiveTab('generation')}
          >
            3_GENERACIÓN
          </button>
        </div>
      </header>

     <section className="module-grid" style={{ flex: 1 }}>
        <div className="module-col-main" style={{ gridColumn: 'span 12', height: '100%', overflow: 'hidden' }}>
           {activeTab === 'generation' && <LetterStation onOpenMapping={() => setActiveTab('mapping')} />}
           {activeTab === 'templates' && <TemplateEditor />}
           {activeTab === 'mapping' && <MappingMatrix />}
        </div>
      </section>

      <style jsx>{`
        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: var(--bg-color);
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 800;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          background: rgba(255,255,255,0.05);
        }
        .tab-btn.active {
          background: var(--border-color);
          color: var(--bg-color);
        }
      `}</style>
    </main>
  );
}
