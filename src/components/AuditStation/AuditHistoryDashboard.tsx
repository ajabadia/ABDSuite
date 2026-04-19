'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db/db';
import { AuditRecord, AuditModule } from '@/lib/types/audit-history.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { IndustrialVirtualTable } from '../common/IndustrialVirtualTable';
import { ListIcon, SearchIcon, AlertTriangleIcon, ActivityIcon, ShieldIcon, ClockIcon } from '../common/Icons';
import { loadAuditRetention, saveAuditRetention, AuditRetentionSettings } from '@/lib/utils/audit-retention-settings';
import { purgeOldAuditRecords } from '@/lib/utils/audit-retention';

const ITEM_HEIGHT = 48;

export const AuditHistoryDashboard: React.FC = () => {
    const { t } = useLanguage();
    const [records, setRecords] = useState<AuditRecord[]>([]);
    const [moduleFilter, setModuleFilter] = useState<AuditModule | 'ALL'>('ALL');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [retention, setRetention] = useState<AuditRetentionSettings>(() => loadAuditRetention());

    const handleRetentionChange = (months: number) => {
        const next = { months: months as any };
        setRetention(next);
        saveAuditRetention(next);
        purgeOldAuditRecords();
    };

    useEffect(() => {
        const fetchHistory = async () => {
            let collection = db.audit_history_v6.orderBy('timestamp').reverse();

            let data = await collection.toArray() as any as AuditRecord[];

            if (moduleFilter !== 'ALL') {
                data = data.filter(r => r.module === moduleFilter);
            }

            setRecords(data);
        };
        fetchHistory();
    }, [moduleFilter]);

    const renderRow = (record: AuditRecord | undefined, idx: number, style: React.CSSProperties) => {
        if (!record) return <div style={style}>...</div>;

        const isSelected = selectedId === record.id;

        return (
            <div
                key={record.id}
                onClick={() => setSelectedId(record.id)}
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    borderBottom: '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(var(--primary-color), 0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                }}
            >
                <div style={{ width: '150px', fontSize: '0.8rem', opacity: 0.7 }}>
                    {new Date(record.timestamp).toLocaleString()}
                </div>
                <div style={{ width: '120px' }}>
                    <span className={`station-badge ${record.module === 'GAWEB_AUDIT' ? 'station-badge-blue' :
                            record.module === 'LETTER_QA' ? 'station-badge-orange' : 'station-badge-green'
                        }`}>
                        {record.module}
                    </span>
                </div>
                <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t(record.messageKey) || record.messageKey}
                </div>
                <div style={{ width: '80px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: record.level === 'error' ? 'var(--status-err)' : 'inherit' }}>
                        {record.level.toUpperCase()}
                    </span>
                </div>
            </div>
        );
    };

    const selectedRecord = records.find(r => r.id === selectedId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
            {/* TOOLBAR */}
            <div className="flex-row" style={{ gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="flex-col">
                    <label className="station-label" style={{ fontSize: '0.65rem' }}>MODULE_FILTER</label>
                    <select
                        className="station-input"
                        value={moduleFilter}
                        onChange={e => setModuleFilter(e.target.value as any)}
                        style={{ width: '180px', height: '36px' }}
                    >
                        <option value="ALL">ALL_MODULES</option>
                        <option value="GAWEB_AUDIT">GAWEB_AUDIT</option>
                        <option value="LETTER_QA">LETTER_QA</option>
                        <option value="CRYPT">CRYPT</option>
                    </select>
                </div>

                <div className="flex-col">
                    <label className="station-label" style={{ fontSize: '0.65rem' }}>RETENTION_PERIOD</label>
                    <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                        <select
                            className="station-input"
                            value={retention.months}
                            onChange={e => handleRetentionChange(Number(e.target.value))}
                            style={{ width: '140px', height: '36px' }}
                        >
                            <option value={3}>3_MONTHS</option>
                            <option value={6}>6_MONTHS</option>
                            <option value={12}>12_MONTHS</option>
                            <option value={24}>24_MONTHS</option>
                        </select>
                        <ClockIcon size={14} style={{ opacity: 0.5 }} />
                    </div>
                </div>

                <div style={{ marginLeft: 'auto', textAlign: 'right', opacity: 0.5, fontSize: '0.75rem' }}>
                    <div>AUTO_PURGE_ENABLED</div>
                    <div style={{ fontSize: '0.6rem' }}>DATA_CLEANUP_EVERY_MONTH</div>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0 }}>
                {/* TABLE SECTION */}
                <div style={{ flex: 2, border: '1px solid var(--border-color)', background: 'var(--surface-color)', position: 'relative' }}>
                    <IndustrialVirtualTable
                        items={records}
                        totalItems={records.length}
                        itemHeight={ITEM_HEIGHT}
                        renderRow={renderRow}
                    />
                </div>

                {/* DETAIL SECTION */}
                <div style={{ flex: 1, border: '1px solid var(--border-color)', background: 'var(--bg-color)', padding: '20px', overflowY: 'auto' }}>
                    {selectedRecord ? (
                        <div className="flex-col" style={{ gap: '16px' }}>
                            <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedRecord.module}</h3>
                                <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>ID: {selectedRecord.id}</div>
                            </div>

                            <div className="station-tech-summary">
                                {selectedRecord.payload.type === 'GAWEB_AUDIT' && (
                                    <>
                                        <div className="station-tech-item"><span className="station-tech-label">FILE:</span> {selectedRecord.payload.data.fileName}</div>
                                        <div className="station-tech-item"><span className="station-tech-label">LINES:</span> {selectedRecord.payload.data.totalLines}</div>
                                        <div className="station-tech-item"><span className="station-tech-label">ERRORS:</span> {selectedRecord.payload.data.totalErrors}</div>
                                    </>
                                )}
                                {selectedRecord.payload.type === 'LETTER_QA' && (
                                    <>
                                        <div className="station-tech-item"><span className="station-tech-label">LOTE:</span> {selectedRecord.payload.data.lote}</div>
                                        <div className="station-tech-item"><span className="station-tech-label">DOC:</span> {selectedRecord.payload.data.codDocumento}</div>
                                        <div className="station-tech-item"><span className="station-tech-label">STATUS:</span> {selectedRecord.payload.data.qaStatus}</div>
                                    </>
                                )}
                            </div>

                            <pre style={{ fontSize: '0.7rem', padding: '12px', background: 'var(--surface-color)', borderRadius: '4px', overflowX: 'auto' }}>
                                {JSON.stringify(selectedRecord.payload.data, null, 2)}
                            </pre>
                        </div>
                    ) : (
                        <div className="station-empty-state">
                            <ActivityIcon size={48} className="station-shimmer-text" />
                            <p>SELECT_RECORD_TO_VIEW_DETAILS</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
