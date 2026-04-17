'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/context/LanguageContext';
import { 
  ShieldCheckIcon, 
  DatabaseIcon, 
  FileTextIcon, 
  ActivityIcon, 
  CpuIcon, 
  LockIcon,
  SearchIcon
} from '@/components/common/Icons';

export default function Dashboard() {
  const { t } = useLanguage();
  const [load, setLoad] = useState([45, 32, 78, 12]);
  const [bootTime, setBootTime] = useState('00:00:00:00');
  
  // Simulate system activity and uptime
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setLoad(prev => prev.map(l => Math.max(5, Math.min(95, l + (Math.random() * 20 - 10)))));
      
      const elapsed = Date.now() - startTime;
      const s = Math.floor(elapsed / 1000) % 60;
      const m = Math.floor(elapsed / 60000) % 60;
      const h = Math.floor(elapsed / 3600000) % 24;
      setBootTime(`00:${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
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
    <div className="dash-container fade-in">
      
      {/* 🚀 LOGO CRT MONITOR */}
      <section className="crt-monitor">
        <div className="crt-glow">
          <pre className="ascii-logo">
            {asciiArt}
          </pre>
          <div className="scanlines"></div>
        </div>
        <div className="crt-bezel-info">
          <span>ASEPTIC v4.1-INDUSTRIAL</span>
          <span className="blink">STATUS: {t('dashboard.sys_status_online')}</span>
        </div>
      </section>

      <div className="dash-main-grid">
        
        {/* 🛠️ MODULE GATEWAY */}
        <section className="dash-stations-grid">
          <ModuleCard 
            title={t('shell.crypt')} 
            desc={t('dashboard.dash_crypt_desc')}
            icon={<LockIcon size={32} />}
            href="/crypt"
            color="var(--primary-color)"
          />
          <ModuleCard 
            title={t('shell.etl')} 
            desc={t('dashboard.dash_etl_desc')}
            icon={<DatabaseIcon size={32} />}
            href="/etl"
            color="var(--primary-color)"
          />
          <ModuleCard 
            title={t('shell.letter')} 
            desc={t('dashboard.dash_letter_desc')}
            icon={<FileTextIcon size={32} />}
            href="/letter?view=generation"
            color="var(--primary-color)"
          />
          <ModuleCard 
            title={t('shell.audit')} 
            desc={t('dashboard.dash_audit_desc')}
            icon={<ShieldCheckIcon size={32} />}
            href="/letter?view=audit"
            color="var(--primary-color)"
          />
        </section>

        {/* 📊 SYSTEM TELEMETRY (BIOS STYLE) */}
        <aside className="dash-sidebar">
          <div className="station-card telemetry-panel">
            <h3 className="telemetry-title"><ActivityIcon size={16} /> {t('dashboard.sys_info')}</h3>
            <div className="telemetry-grid">
              <div className="tel-item"><span>KERNEL:</span> <span className="tel-val">v4.1.0-IND</span></div>
              <div className="tel-item"><span>UPTIME:</span> <span className="tel-val mono">{bootTime}</span></div>
              <div className="tel-item"><span>NET:</span> <span className="tel-val gapped">AIR-GAPPED</span></div>
              <div className="tel-item"><span>MEM:</span> <span className="tel-val ok">{t('dashboard.sys_memory_clean')}</span></div>
            </div>

            <div className="core-monitor">
              <h4 className="sub-title"><CpuIcon size={14} /> {t('dashboard.core_load')}</h4>
              {load.map((v, i) => (
                <div key={i} className="core-bar-wrapper">
                  <div className="core-label">CORE {i}</div>
                  <div className="segmented-bar">
                    {Array.from({ length: 20 }).map((_, j) => (
                      <div 
                        key={j} 
                        className={`segment ${v / 5 >= j ? 'active' : ''} ${v > 80 && j > 15 ? 'hot' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="core-percent">{Math.round(v)}%</div>
                </div>
              ))}
            </div>

            <div className="integrity-pulse">
              <div className="pulse-circle"></div>
              <span>{t('dashboard.sys_location')}</span>
            </div>
          </div>

          <div className="station-card dash-report">
            <h3 className="telemetry-title"><SearchIcon size={16} /> {t('dashboard.ready_prompt')}</h3>
            <div className="system-logs-preview">
              <div className="log-line">{" > "}BOOT_SEQUENCE: OK</div>
              <div className="log-line">{" > "}SECURE_STORAGE: MOUNTED</div>
              <div className="log-line">{" > "}WORKER_THREADS: POOLING...</div>
              <div className="log-line active">{" > "}READY_FOR_COMMAND_INPUT.</div>
            </div>
          </div>
        </aside>

      </div>

      <style jsx>{`
        .dash-container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* CRT MONITOR */
        .crt-monitor {
          background: #050505;
          border: 12px solid #1a1a1a;
          border-radius: 4px;
          position: relative;
          padding: 40px;
          box-shadow: 0 0 40px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.8);
          overflow: hidden;
        }

        .crt-glow {
          position: relative;
          z-index: 2;
        }

        .ascii-logo {
          font-size: clamp(0.4rem, 0.8vw, 0.7rem);
          line-height: 1.1;
          color: var(--primary-color);
          text-shadow: 0 0 10px var(--primary-color);
          margin: 0;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .scanlines {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%, 
            rgba(0, 0, 0, 0.1) 50%
          ), linear-gradient(
            90deg, 
            rgba(255, 0, 0, 0.02), 
            rgba(0, 255, 0, 0.01), 
            rgba(0, 0, 255, 0.02)
          );
          background-size: 100% 3px, 3px 100%;
          pointer-events: none;
          z-index: 3;
        }

        .crt-bezel-info {
          position: absolute;
          bottom: 10px;
          width: calc(100% - 80px);
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--primary-color);
          opacity: 0.6;
          font-weight: 800;
        }

        .blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }

        /* GRID */
        .dash-main-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }

        .dash-stations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        /* TELEMETRY */
        .telemetry-panel {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: rgba(var(--primary-color-rgb), 0.05) !important;
        }

        .telemetry-title {
          font-size: 0.85rem;
          font-weight: 900;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }

        .telemetry-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.75rem;
          font-family: var(--font-mono);
        }

        .tel-item { display: flex; justify-content: space-between; }
        .tel-val { font-weight: 900; }
        .tel-val.mono { letter-spacing: 1px; }
        .tel-val.gapped { color: var(--primary-color); }
        .tel-val.ok { color: var(--primary-color); }

        .core-monitor { margin-top: 12px; }
        .sub-title { font-size: 0.75rem; margin-bottom: 12px; opacity: 0.6; display: flex; gap: 6px; align-items: center; }

        .core-bar-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .core-label { font-size: 0.6rem; font-weight: 800; width: 45px; }
        .segmented-bar {
          flex: 1;
          display: flex;
          gap: 2px;
        }

        .segment {
          flex: 1;
          height: 8px;
          background: rgba(var(--primary-color-rgb), 0.1);
          border-radius: 1px;
        }
        .segment.active { background: var(--primary-color); box-shadow: 0 0 5px var(--primary-color); }
        .segment.hot.active { background: var(--primary-color); box-shadow: 0 0 5px var(--primary-color); }

        .core-percent { font-size: 0.65rem; font-weight: 900; width: 35px; text-align: right; }

        .integrity-pulse {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.65rem;
          font-weight: 800;
          opacity: 0.8;
        }

        .pulse-circle {
          width: 8px;
          height: 8px;
          background: var(--primary-color);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--primary-color-rgb), 0.7); }
          70% { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(var(--primary-color-rgb), 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--primary-color-rgb), 0); }
        }

        .system-logs-preview {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .log-line.active { color: var(--status-ok); }

        @media (max-width: 1000px) {
          .dash-main-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function ModuleCard({ title, desc, icon, href, color }: { title: string, desc: string, icon: React.ReactNode, href: string, color: string }) {
  return (
    <Link href={href} className="module-card-link" aria-label={title}>
      <div className="module-card-container" style={{ '--card-accent': color } as any}>
        <div className="module-card-inner">
          <div className="module-header-wrap">
            <div className="module-icon-box" aria-hidden="true">
              {icon}
            </div>
            <h3 className="module-title-uncodix">{title}</h3>
          </div>
          <p className="module-desc-uncodix">{desc}</p>
          <div className="module-footer">
            <span className="module-status-indicator" style={{ background: color }}></span>
            <span className="module-action-text">OPEN MODULE</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .module-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .module-card-container {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          height: 100%;
          position: relative;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
        }

        .module-card-container:hover {
          border-color: var(--card-accent);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .module-card-inner {
          padding: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .module-header-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .module-icon-box {
          color: var(--card-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }

        .module-card-container:hover .module-icon-box {
          opacity: 1;
        }

        .module-title-uncodix {
          font-size: 0.95rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: 0.5px;
          color: var(--text-primary);
        }

        .module-desc-uncodix {
          font-size: 0.8rem;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
          opacity: 0.7;
          flex-grow: 1;
        }

        .module-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid rgba(var(--primary-color-rgb), 0.05);
        }

        .module-status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          box-shadow: 0 0 4px var(--card-accent);
        }

        .module-action-text {
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 1px;
          opacity: 0.4;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .module-card-container:hover .module-action-text {
          opacity: 0.8;
          transform: translateX(4px);
        }

        /* Ambient subtle light for uncodixfy feel */
        .module-card-container::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--card-accent), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .module-card-container:hover::after {
          opacity: 0.5;
        }
      `}</style>
    </Link>
  );
}
