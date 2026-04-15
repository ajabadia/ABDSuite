'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { LetterTemplate } from '@/lib/types/letter.types';
import { TrashIcon } from '@/components/common/Icons';

const TemplateEditor: React.FC = () => {
  const { t } = useLanguage();
  const templates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleCreate = async () => {
    const id = await db.letter_templates.add({
      name: 'NUEVA_PLANTILLA',
      content: '<h1>CARTA_TITULO</h1>\n<p>Estimado/a {{NOMBRE}}:</p>\n<p>Contenido...</p>',
      updatedAt: Date.now()
    });
    setSelectedId(id as number);
    setEditName('NUEVA_PLANTILLA');
    setEditContent('<h1>CARTA_TITULO</h1>\n<p>Estimado/a {{NOMBRE}}:</p>\n<p>Contenido...</p>');
  };

  const handleSave = async () => {
    if (!selectedId) return;
    await db.letter_templates.update(selectedId, {
      name: editName,
      content: editContent,
      updatedAt: Date.now()
    });
    alert('TEMPLATE_SAVED_SUCCESSFULLY');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('DELETE_TEMPLATE?')) return;
    await db.letter_templates.delete(id);
    if (selectedId === id) {
      setSelectedId(null);
      setEditName('');
      setEditContent('');
    }
  };

  const selectTemplate = (tmpl: LetterTemplate) => {
    setSelectedId(tmpl.id || null);
    setEditName(tmpl.name);
    setEditContent(tmpl.content);
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1px', background: 'var(--border-color)' }}>
      <aside style={{ width: '280px', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px' }}>
          <button className="station-btn" style={{ width: '100%' }} onClick={handleCreate}>+ NEW_TEMPLATE</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {templates.map(tmpl => (
            <div 
              key={tmpl.id} 
              className={`nav-item ${selectedId === tmpl.id ? 'active' : ''}`}
              style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 20px' }}
              onClick={() => selectTemplate(tmpl)}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tmpl.name}</span>
              <button 
                className="station-btn" 
                style={{ padding: '4px', background: 'transparent', boxShadow: 'none', border: 'none' }}
                onClick={(e) => { e.stopPropagation(); tmpl.id && handleDelete(tmpl.id); }}
              >
                <TrashIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', padding: '30px', gap: '30px', overflowY: 'auto' }}>
        {selectedId ? (
          <>
            <header className="station-card" style={{ padding: '20px', display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'flex-end', position: 'relative' }}>
              <span className="station-card-title">Identificación de Plantilla</span>
              <div style={{ flex: 1 }}>
                <label className="station-label">NOMBRE:</label>
                <input 
                  className="station-input" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <button className="station-btn station-btn-primary" onClick={handleSave}>SAVE_CHANGES</button>
            </header>
            
            <div className="station-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className="station-card-title">Compositor HTML (Mono)</span>
              <label className="station-label">CONTENIDO (Use {'{{variable}}'} para mapeo):</label>
              <textarea 
                className="station-textarea"
                style={{ flex: 1, height: '300px', backgroundColor: '#000', color: '#32cd32', borderStyle: 'double', fontVariantLigatures: 'none' }}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="<html>...</html>"
              />
            </div>

            <div className="station-card">
               <span className="station-card-title">Live Preview (Aseptic Box)</span>
               <div 
                 style={{ background: 'white', color: 'black', padding: '40px', minHeight: '400px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)', border: '1px solid #ccc', overflow: 'auto' }}
                 dangerouslySetInnerHTML={{ __html: editContent }}
               />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px' }}>
            SELECCIONE O CREE UNA PLANTILLA PARA EDITAR
          </div>
        )}
      </main>
    </div>
  );
};

export default TemplateEditor;
