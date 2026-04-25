/**
 * DocCatalogService (Phase 18)
 * Centralized governance for CATDOCUM (Document Catalog).
 */
import { db } from '../db/db';
import { LocalDocCatalogEntry } from '../types/doc-catalog.types';
import { auditService } from './AuditService';

export class DocCatalogService {
  static async getAllEntries(): Promise<LocalDocCatalogEntry[]> {
    return db.doc_catalog_v1.toArray();
  }

  static async saveEntry(entry: LocalDocCatalogEntry, operatorId?: string): Promise<void> {
    await db.doc_catalog_v1.put(entry);
    
    await auditService.log({
      module: 'SUPERVISOR',
      messageKey: 'CONFIG_DOC_CATALOG_SAVE',
      status: 'INFO',
      operatorId,
      details: {
        eventType: 'CONFIG_DOC_CATALOG_SAVE',
        entityType: 'DOC_CATALOG',
        entityId: entry.codigoDocumento,
        actorId: operatorId,
        context: {
            name: entry.name,
            templateId: entry.defaultTemplateId || 'NONE'
        }
      }
    });
  }

  static async deleteEntry(id: string, operatorId?: string): Promise<void> {
    const entry = await db.doc_catalog_v1.get(id);
    if (!entry) return;

    await db.doc_catalog_v1.delete(id);

    await auditService.log({
      module: 'SUPERVISOR',
      messageKey: 'CONFIG_DOC_CATALOG_DELETE',
      status: 'WARNING',
      operatorId,
      details: {
        eventType: 'CONFIG_DOC_CATALOG_DELETE',
        entityType: 'DOC_CATALOG',
        entityId: entry.codigoDocumento,
        actorId: operatorId,
        context: {
            name: entry.name
        }
      }
    });
  }

  static async toggleStatus(id: string, operatorId?: string): Promise<void> {
    const entry = await db.doc_catalog_v1.get(id);
    if (!entry) return;

    const nextStatus = !entry.isActive;
    await db.doc_catalog_v1.update(id, { isActive: nextStatus, updatedAt: Date.now() });

    await auditService.log({
      module: 'SUPERVISOR',
      messageKey: 'CONFIG_DOC_CATALOG_STATUS',
      status: 'INFO',
      operatorId,
      details: {
        eventType: 'CONFIG_DOC_CATALOG_STATUS',
        entityType: 'DOC_CATALOG',
        entityId: entry.codigoDocumento,
        actorId: operatorId,
        context: {
            isActive: nextStatus
        }
      }
    });
  }
}
