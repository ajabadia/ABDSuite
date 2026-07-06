/**
 * @purpose Encapsula el cálculo de uso de almacenamiento y la emisión de alertas de cuota de tenant.
 * @purpose_en Encapsulates storage usage calculations and tenant quota warnings.
 * @classification Business Service
 * @complexity Medium
 */

import { createPublisher, SystemEventType } from '@ajabadia/satellite-sdk/event-bus';
import DocumentVersion from '@/models/DocumentVersion';
import StorageConnector from '@/models/StorageConnector';

const publisher = createPublisher({ source: 'abdfiles' });

export async function checkQuotaAndPublish(tenantId: string): Promise<void> {
  const [result] = await DocumentVersion.aggregate([
    { $match: { tenantId } },
    { $group: { _id: null, totalBytes: { $sum: '$sizeBytes' } } }
  ]);
  if (!result) return;

  const connector = await StorageConnector.findOne({ tenantId, status: 'active' });
  if (!connector || !connector.maxQuotaBytes) return;

  const percentage = result.totalBytes / connector.maxQuotaBytes;
  const lastWarning = connector.lastQuotaWarningPercentage || 0;

  let threshold: number | null = null;
  if (percentage >= 0.9 && lastWarning < 0.9) {
    threshold = 0.9;
  } else if (percentage >= 0.8 && lastWarning < 0.8) {
    threshold = 0.8;
  }

  if (threshold !== null) {
    await publisher.publish(SystemEventType.TENANT_QUOTA_EXCEEDED, {
      tenantId,
      usedBytes: result.totalBytes,
      maxQuotaBytes: connector.maxQuotaBytes,
      percentage: Math.round(percentage * 100),
      threshold: Math.round(threshold * 100),
    });
    connector.lastQuotaWarningPercentage = threshold;
    await connector.save();
  }
}
