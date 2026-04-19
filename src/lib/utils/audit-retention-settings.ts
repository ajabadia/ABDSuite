export interface AuditRetentionSettings {
  months: 3 | 6 | 12 | 24;
}

const RETENTION_KEY = 'abdfn-audit-retention';

export function loadAuditRetention(): AuditRetentionSettings {
  if (typeof window === 'undefined') return { months: 12 };
  try {
    const raw = localStorage.getItem(RETENTION_KEY);
    if (!raw) return { months: 12 };
    const parsed = JSON.parse(raw) as AuditRetentionSettings;
    return parsed;
  } catch {
    return { months: 12 };
  }
}

export function saveAuditRetention(settings: AuditRetentionSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RETENTION_KEY, JSON.stringify(settings));
}
