/**
 * Industrial Error Governance - ABDFN Unified Suite (ERA 6.1)
 */

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly details?: any;

  constructor(message: string, code: string, severity: ErrorSeverity = 'MEDIUM', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 'LOW', details);
  }
}

export class SecurityError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'SECURITY_ERROR', 'HIGH', details);
  }
}

export class IntegrityError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'INTEGRITY_ERROR', 'CRITICAL', details);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(`${entity} with ID ${id} not found`, 'NOT_FOUND', 'LOW');
  }
}
