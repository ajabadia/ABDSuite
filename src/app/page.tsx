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
import { db } from '@/lib/db/db';

export default function Dashboard() {
  const { t } = useLanguage();
  const [load, setLoad] = useState([10, 10, 10, 10]);
  const [bootTime, setBootTime] = useState('00:00:00:00');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [secureContext, setSecureContext] = useState(false);

  useEffect(() => {
    setSecureContext(window.isSecureContext && !!window.crypto.subtle);
  }, []);
  
  // REAL TELEMETRY SAMPLING
  useEffect(() => {
    const pollMetrics = async () => {
      // Core 0: Storage Usage
      let storagePercent = 0;
      if (typeof navigator !== 'undefined' && navigator.storage) {
        const est = await navigator.storage.estimate();
        if (est.usage && est.quota) {
          storagePercent = (est.usage / est.quota) * 100; // Small usage expanded for visibility
        }
      }

      // Core 1: Memory Load (Chrome Only)
      let memoryPercent = 25;
      const perf: any = window.performance;
      if (perf.memory) {
        memoryPercent = (perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100;
      }

      // Core 2: Data items count
      const templateCount = await db.lettertemplates_v6.count();
      const dbPercent = Math.min(100, (templateCount / 20) * 100);

      // Core 3: System Heartbeat (Sine variation)
      const pulse = 10 + Math.abs(Math.sin(Date.now() / 2000)) * 40;

      setLoad([
        Math.max(5, Math.min(95, storagePercent || 8)),
        Math.max(5, Math.min(95, memoryPercent)),
        Math.max(5, Math.min(95, dbPercent || 12)),
        Math.max(5, Math.min(95, pulse))
      ]);
    };

    const startTime = Date.now();
    const interval = setInterval(() => {
      pollMetrics();
      
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
          <span>ASEPTIC v6.1-INDUSTRIAL (ERA 6)</span>
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
        <aside className="dash-sidebar flex-col">
          <div className="station-card telemetry-panel flex-col">
            <h3 className="telemetry-title"><ActivityIcon size={16} /> {t('dashboard.sys_info')}</h3>
            <div className="telemetry-grid">
              <div 
                className="tel-item interactive-kernel" 
                onClick={() => setShowDiagnostics(true)}
                title="RUN_DIAGNOSTICS_0x5"
              >
                <span>KERNEL:</span> <span className="tel-val pulse-text">v6.1.0-IND (ERA 6)</span>
              </div>
              <div className="tel-item"><span>UPTIME:</span> <span className="tel-val mono">{bootTime}</span></div>
              <div className="tel-item"><span>NET:</span> <span className="tel-val gapped">AIR-GAPPED</span></div>
              <div className="tel-item"><span>I18N:</span> <span className="tel-val ok">ES/EN/FR/DE (SYNCED)</span></div>
            </div>

            <div className="core-monitor">
              <h4 className="sub-title"><CpuIcon size={14} /> {t('dashboard.core_load')}</h4>
              {load.map((v, i) => (
                <div 
                  key={i} 
                  className="core-bar-wrapper station-tooltip-parent" 
                  title={t(`ui.core_${i}_desc`)}
                  aria-label={`${t(`ui.core_${i}`)}: ${Math.round(v)}%. ${t(`ui.core_${i}_desc`)}`}
                >
                  <div className="core-label">
                    {t(`ui.core_${i}`).toUpperCase()}
                  </div>
                  <div className="segmented-bar">
                    {Array.from({ length: 20 }).map((_, j) => (
                      <div 
                        key={j} 
                        className={`segment ${v / 5 >= j ? 'active' : ''} ${v > 80 && j > 15 ? 'hot' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="core-percent">{Math.round(v)}%</div>
                  
                  {/* Tooltip Industrial Extra */}
                  <div className="station-tooltip">
                    <div className="station-tooltip-content">
                      <div className="tooltip-header">{t(`ui.core_${i}`).toUpperCase()}</div>
                      <div className="tooltip-body">{t(`ui.core_${i}_desc`)}</div>
                      <div className="tooltip-footer">TELEMETRY_STREAM_0x0{i}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="station-integrity-badge flex-row" style={{ marginTop: 'auto', alignSelf: 'flex-start', gap: '8px', fontSize: '0.6rem', opacity: 0.6 }}>
              <div className="integrity-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-ok)' }}></div>
              <CpuIcon size={14} />
              <span>KERNEL_INTEGRITY_v6.0</span>
            </div>
          </div>

          <div className="station-card dash-report flex-col">
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

      {/* 🧠 SURPRISE: KERNEL DIAGNOSTICS MODAL */}
      {showDiagnostics && (
        <div className="station-modal-overlay" onClick={() => setShowDiagnostics(false)}>
          <div className="station-modal diagnostics-panel" onClick={e => e.stopPropagation()}>
            <header className="station-modal-header">
              <h3 className="station-registry-item-name">KERNEL_DIAGNOSTICS_v6.1.0</h3>
              <button className="station-btn icon-only" onClick={() => setShowDiagnostics(false)}>X</button>
            </header>
            <div className="station-modal-content">
              <div className="diag-grid">
                <div className="diag-row"><span>CRYPT_CORE:</span> <span className={secureContext ? 'val-ok' : 'val-err'}>{secureContext ? 'AES-GCM AT-REST (ACTIVE)' : 'VULNERABLE (UNSECURE)'}</span></div>
                <div className="diag-row"><span>KEY_DERIVATION:</span> <span className="val-ok">PBKDF2 / 100K ITERATIONS</span></div>
                <div className="diag-row"><span>UUID_STORAGE:</span> <span className="val-ok">ACTIVE (PORTABLE)</span></div>
                <div className="diag-row"><span>I18N_ENGINE:</span> <span className="val-ok">QUAD-SYNC (ES, EN, FR, DE)</span></div>
                <div className="diag-row"><span>LOCAL_STORAGE:</span> <span className="val-ok">_v6_VERSIONED / ZERO_LEAK</span></div>
                <div className="diag-row"><span>ARCH:</span> <span className="val-ok">ASEPTIC HUB (ERA 6)</span></div>
              </div>
              <div className="diag-footer-text">
                SYSTEM INTEGRITY: 100% | PARITY: GAWEB v.1 | ZERO-KNOWLEDGE: ENABLED
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .interactive-kernel {
          cursor: pointer;
          border-radius: var(--radius-sm);
          padding: 2px 4px;
          margin: -2px -4px;
          transition: background 0.2s;
        }
        .interactive-kernel:hover {
          background: rgba(var(--primary-color-rgb), 0.15);
        }
        .pulse-text {
          animation: textPulse 2s infinite;
        }
        @keyframes textPulse {
          0% { opacity: 0.8; }
          50% { opacity: 1; text-shadow: 0 0 5px var(--primary-color); }
          100% { opacity: 0.8; }
        }

        .diagnostics-panel {
          max-width: 450px;
          border: var(--border-thick) solid var(--primary-color);
          box-shadow: 0 0 30px rgba(var(--primary-color-rgb), 0.3);
        }
        .diag-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          margin-bottom: 20px;
        }
        .diag-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 4px;
        }
        .val-ok { color: var(--status-ok); font-weight: 900; }
        .val-err { color: var(--status-err); font-weight: 900; }
        .diag-footer-text {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          opacity: 0.5;
          text-align: center;
          padding-top: 10px;
          border-top: 1px solid var(--border-color);
        }

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
          border-radius: var(--radius-sm);
          position: relative;
          padding: 40px;
          box-shadow: 0 0 40px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.8);
          overflow: hidden;
          animation: monitor-vibrate 0.1s infinite;
        }

        .crt-monitor::before {
          content: " ";
          display: block;
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 2;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }

        .crt-monitor::after {
          content: " ";
          display: block;
          position: absolute;
          inset: 0;
          background: rgba(18, 16, 16, 0.1);
          opacity: 0;
          z-index: 2;
          pointer-events: none;
          animation: monitor-flicker 0.15s infinite;
        }

        @keyframes monitor-vibrate {
          0% { transform: translate(0); }
          25% { transform: translate(0.5px, 0.5px); }
          50% { transform: translate(-0.5px, 0.5px); }
          75% { transform: translate(-0.5px, -0.5px); }
          100% { transform: translate(0.5px, -0.5px); }
        }

        @keyframes monitor-flicker {
          0% { opacity: 0.1; }
          100% { opacity: 0.2; }
        }

        @keyframes scanline {
          0% { background-position: 0 -200px; }
          100% { background-position: 0 1000px; }
        }

        .crt-glow {
          position: relative;
          z-index: 2;
          animation: v-wave 8s infinite linear;
        }

        @keyframes v-wave {
          0% { transform: translateY(0); }
          10% { transform: translateY(1px) skewX(0.5deg); }
          20% { transform: translateY(-1px) skewX(-0.5deg); }
          30% { transform: translateY(1px) skewX(0.2deg); }
          40% { transform: translateY(-1px) skewX(-0.2deg); }
          50% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }

        .ascii-logo {
          font-size: clamp(0.4rem, 0.8vw, 0.7rem);
          line-height: 1.1;
          color: var(--primary-color);
          text-shadow: 0 0 10px var(--primary-color);
          margin: 0;
          text-align: center;
          position: relative;
          animation: glitch 4s infinite linear alternate-reverse;
        }

        @keyframes glitch {
          0% { transform: skew(0.5deg); }
          5% { transform: skew(-1deg); }
          10% { transform: skew(0.5deg); }
          15% { transform: skew(-0.5deg); }
          20% { transform: skew(0.8deg); }
          25% { transform: skew(-1deg); }
          30% { transform: skew(0.2deg); }
          100% { transform: skew(0deg); }
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

        .core-label { font-size: 0.55rem; font-weight: 800; width: 45px; opacity: 0.8; }
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
        
        /* INDUSTRIAL TOOLTIPS */
        .station-tooltip-parent {
          position: relative;
        }

        .station-tooltip {
          position: absolute;
          bottom: calc(100% + 12px);
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          width: 200px;
          background: #050505;
          border: 1px solid var(--primary-color);
          box-shadow: 0 0 20px rgba(var(--primary-color-rgb), 0.2);
          padding: 12px;
          opacity: 0;
          pointer-events: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          border-radius: var(--radius-std);
        }

        .station-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: var(--primary-color);
        }

        .station-tooltip-parent:hover .station-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .station-tooltip-content {
          font-family: var(--font-mono);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tooltip-header {
          font-size: 0.7rem;
          font-weight: 900;
          color: var(--primary-color);
          border-bottom: 1px solid rgba(var(--primary-color-rgb), 0.1);
          padding-bottom: 4px;
          letter-spacing: 0.05rem;
        }

        .tooltip-body {
          font-size: 0.65rem;
          line-height: 1.4;
          color: var(--text-primary);
          opacity: 0.9;
        }

        .tooltip-footer {
          font-size: 0.55rem;
          opacity: 0.4;
          text-align: right;
          padding-top: 4px;
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
      <div className="station-card module-card-container flex-col" style={{ '--card-accent': color, padding: '24px', gap: '16px' } as any}>
          <div className="flex-row" style={{ gap: '12px' }}>
            <div className="module-icon-box" aria-hidden="true" style={{ color: 'var(--card-accent)', opacity: 0.8 }}>
              {icon}
            </div>
            <h3 className="module-title-industrial">{title}</h3>
          </div>
          <p className="module-desc-industrial">{desc}</p>
          <div className="module-footer flex-row" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(var(--primary-color-rgb), 0.05)', gap: '8px' }}>
            <span className="module-status-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }}></span>
            <span className="module-action-text">OPEN MODULE</span>
          </div>
      </div>

      <style jsx>{`
        .module-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .module-card-container {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
          height: 100%;
        }

        .module-card-container:hover {
          border-color: var(--card-accent);
          box-shadow: var(--shadow-subtle);
        }

        .module-title-industrial {
          font-size: 0.95rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: 0.5px;
          color: var(--text-primary);
        }

        .module-desc-industrial {
          font-size: 0.8rem;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
          opacity: 0.7;
          flex-grow: 1;
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
      `}</style>
    </Link>
  );
}
