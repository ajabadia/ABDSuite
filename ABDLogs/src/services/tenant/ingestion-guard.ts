import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AuditLog } from '@/models/AuditLog';
import { AlertEvent } from '@/models/AlertEvent';
import { AlertService } from './alert-service';
import type { IAuditLog } from '@/models/AuditLog';

const AUTH_FAILURE_THRESHOLD = 5;
const AUTH_FAILURE_WINDOW_MS = 60_000;

export async function checkAnomalyThresholds(logData: {
  tenantId: string;
  action: string;
  ip?: string;
  userEmail?: string;
}) {
  if (logData.action !== 'AUTH_FAILURE' || !logData.ip) return;

  await connectDB();

  const since = new Date(Date.now() - AUTH_FAILURE_WINDOW_MS);
  const failureCount = await AuditLog.countDocuments({
    tenantId: logData.tenantId,
    action: 'AUTH_FAILURE',
    ipAddress: logData.ip,
    createdAt: { $gte: since },
  });

  if (failureCount >= AUTH_FAILURE_THRESHOLD) {
    await AlertEvent.create({
      tenantId: logData.tenantId,
      thresholdId: 'builtin:spike_logins',
      thresholdName: 'Spike de autenticación fallida',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      message: `${failureCount} intentos de autenticación fallidos desde IP ${logData.ip} en 60 segundos.`,
      appId: 'abdlogs',
      matchCount: failureCount,
      windowMinutes: 1,
      matchingLogIds: [],
      createdAt: new Date(),
    });
  }
}

export async function runIngestionGuards(newLog: IAuditLog) {
  await Promise.allSettled([
    checkAnomalyThresholds({
      tenantId: newLog.tenantId,
      action: newLog.action,
      ip: newLog.ipAddress,
      userEmail: newLog.userEmail,
    }),
    AlertService.evaluateLog(newLog),
  ]);
}
