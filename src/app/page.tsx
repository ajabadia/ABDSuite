'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';

export default function Dashboard() {
  const { t } = useLanguage();
  const [load, setLoad] = useState([45, 32, 78, 12]);
  
  // Simulate system activity
  useEffect(() => {
    const interval = setInterval(() => {
      setLoad(prev => prev.map(l => Math.max(5, Math.min(95, l + (Math.random() * 20 - 10)))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const asciiArt = `
█████╗ ██████╗ ██████╗ ███████╗███╗   ██╗    ███████╗██╗   ██╗██╗████████╗███████╗
██╔══██╗██╔══██╗██╔══██╗██╔════╝████╗  ██║    ██╔════╝██║   ██║██║╚══██╔══╝██╔════╝
███████║██████╔╝██║  ██║█████╗  ██╔██╗ ██║    ███████╗██║   ██║██║   ██║   █████╗  
██╔══██║██╔══██╗██║  ██║██╔══╝  ██║╚██╗██║    ╚════██║██║   ██║██║   ██║   ██╔══╝  
██║  ██║██████╔╝██████╔╝██║     ██║ ╚████║    ███████║╚██████╔╝██║   ██║   ███████╗
╚═╝  ╚═╝╚═════╝ ╚═════╝ ╚═╝     ╚═╝  ╚═══╝    ╚══════╝ ╚═════╝ ╚═╝   ╚═╝   ╚══════╝
  `;

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <pre style={{ 
        fontSize: '0.6rem', 
        lineHeight: 1, 
        color: 'var(--text-primary)', 
        marginBottom: '40px',
        overflowX: 'auto'
      }}>
        {asciiArt}
      </pre>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <section className="glass" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
            {t('dashboard.sys_info')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px', fontSize: '0.9rem' }}>
            <span>KERNEL:</span> <span style={{ color: 'var(--secondary-color)' }}>v5.0.0-ASEPTIC</span>
            <span>UPTIME:</span> <span>00:14:55:02</span>
            <span>AUTH:</span> <span style={{ color: 'var(--secondary-color)' }}>ROOT / LOCAL_USER</span>
            <span>NET:</span> <span style={{ color: 'var(--accent-color)' }}>AIR_GAPPED (OFFLINE)</span>
          </div>
        </section>

        <section className="glass" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
            {t('dashboard.core_load')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {load.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ minWidth: '60px', fontSize: '0.8rem' }}>CORE {i}</span>
                <div style={{ 
                  flex: 1, 
                  height: '14px', 
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255,255,255,0.05)',
                  position: 'relative'
                }}>
                  <div style={{ 
                    width: `${v}%`, 
                    height: '100%', 
                    background: v > 80 ? 'var(--accent-color)' : 'var(--secondary-color)',
                    transition: 'width 1s steps(10)'
                  }} />
                </div>
                <span style={{ minWidth: '40px', fontSize: '0.8rem', textAlign: 'right' }}>{Math.round(v)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass" style={{ padding: '20px', gridColumn: 'span 2' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
            {t('dashboard.welcome')}
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {t('dashboard.ready_prompt')}
          </p>
          <div style={{ 
            padding: '20px', 
            background: 'rgba(0,0,0,0.2)', 
            border: '2px dashed var(--border-color)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--secondary-color)'
          }}>
            [ SYSTEM REPORT ]<br />
            - CRYPT_STATION: ONLINE (AES-GCM-256)<br />
            - ETL_STUDIO: STANDBY (ENCRYPTION_LOCKED)<br />
            - LETTER_STATION: STANDBY (MAPPING_LOCKED)<br />
            ---<br />
            SELECT MODULE FROM SIDEBAR TO COMMENCE OPERATIONS.
          </div>
        </section>
      </div>

      <style jsx>{`
        .glass {
          background: var(--surface-color);
          border: 4px solid var(--border-color);
        }
      `}</style>
    </div>
  );
}
