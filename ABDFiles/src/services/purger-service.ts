/**
 * @purpose Encapsula el procesamiento de trabajos de purga y eliminación física de documentos expirados.
 * @purpose_en Encapsulates the processing of purging jobs and physical deletion of expired documents.
 * @classification Business Service
 * @complexity Medium
 */

import crypto from 'crypto';
import Document from '@/models/Document';
import DocumentVersion from '@/models/DocumentVersion';
import DeletionJob from '@/models/DeletionJob';
import DocumentEvent from '@/models/DocumentEvent';
import { StorageService } from './storage-service';
import { WebhookService } from './webhook-service';
import { IntegrationLogsService } from './integration-logs-service';

export const PurgerService = {
  /**
   * Worker method to process pending deletion jobs.
   */
  async purgeExpiredDocuments(now: Date): Promise<void> {
    // Find deletion jobs that are pending and due
    const pendingJobs = await DeletionJob.find({
      status: 'pending',
      purgeAt: { $lte: now }
    });

    for (const job of pendingJobs) {
      try {
        const asset = await Document.findOne({ tenantId: job.tenantId, assetId: job.assetId });
        if (!asset) {
          job.status = 'failed';
          job.lastError = 'Associated document asset not found';
          await job.save();
          continue;
        }

        // If a legal hold is active, bypass purging for now
        if (asset.legalHold) {
          continue;
        }

        // Fetch current version to know the mimeType for destruction
        const currentVersion = await DocumentVersion.findOne({
          tenantId: job.tenantId,
          assetId: job.assetId,
          versionId: asset.currentVersionId
        });

        const mimeType = currentVersion?.mimeType || 'application/octet-stream';

        // Physically delete from storage
        await StorageService.deleteFile(asset.storageRefCurrent, mimeType, job.tenantId);

        // Update document status
        asset.status = 'purged';
        asset.version = asset.version + 1;
        await asset.save();

        // Update job status
        job.status = 'completed';
        job.attempts = job.attempts + 1;
        await job.save();

        // Write audit event
        await DocumentEvent.create({
          eventId: crypto.randomUUID(),
          tenantId: job.tenantId,
          assetId: job.assetId,
          type: 'DOCUMENT_PURGED',
          actorId: 'cron-worker',
          correlationId: crypto.randomUUID(),
          payload: {
            purgedAt: now.toISOString()
          }
        });

        // Integrate external webhook and logs replication
        const eventPayload = { assetId: job.assetId, purgedAt: now.toISOString() };
        void WebhookService.emitWebhook('DOCUMENT_PURGED', job.tenantId, eventPayload);
        void IntegrationLogsService.replicateEvent(job.tenantId, job.assetId, 'DOCUMENT_PURGED', eventPayload);
      } catch (error: unknown) {
        const err = error as Error;
        job.attempts = job.attempts + 1;
        job.lastError = err.message || 'Unknown purging error';
        if (job.attempts >= 5) {
          job.status = 'failed';
        }
        await job.save();
      }
    }
  }
};
