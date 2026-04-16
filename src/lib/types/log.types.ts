export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  id: string;
  timestamp: string; // ISO format
  app: string;      // e.g., 'CRYPT', 'ETL', 'LETTER', 'SYSTEM'
  level: LogLevel;
  message: string;
  data?: any;       // Optional detailed data
}

export interface LogFilter {
  app?: string;
  date?: string;    // YYYY-MM-DD
  search?: string;  // Search in message, app, or timestamp
}
