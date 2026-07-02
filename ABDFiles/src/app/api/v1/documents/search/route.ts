/**
 * @purpose Gestiona búsquedas de documentos, asegurando acceso industrial y aplicando lógica empresarial para autorización.
 * @purpose_en Handles document search requests, ensuring industrial access and applying business logic for authorization.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:6,sig:sw5y5i
 * @lastUpdated 2026-07-02T18:45:15.964Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { logger } from '@ajabadia/satellite-sdk/logger';
import type { PipelineStage } from 'mongoose';
import Document from '@/models/Document';
import { assertAccess } from '@/lib/abac';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const user = await ensureIndustrialAccess();
    await assertAccess({ userId: user.email || 'system', tenantId: user.tenantId, resource: 'document', action: 'search' });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!q.trim()) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const pipeline = [
      {
        $search: {
          index: 'documents_search',
          compound: {
            must: [{
              text: {
                query: q,
                path: ['title', 'tags'],
                fuzzy: { maxEdits: 1 }
              }
            }],
            filter: [{
              text: {
                query: user.tenantId,
                path: 'tenantId'
              }
            }]
          }
        }
      },
      { $skip: offset },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          assetId: 1,
          title: 1,
          tags: 1,
          status: 1,
          sensitivityLevel: 1,
          retentionClass: 1,
          storageProvider: 1,
          currentVersionId: 1,
          version: 1,
          legalHold: 1,
          createdAt: 1,
          updatedAt: 1,
          score: { $meta: 'searchScore' }
        }
      }
    ];
    const results = await Document.aggregate(pipeline as PipelineStage[]);

    await logger.audit({
      tenantId: user.tenantId,
      action: 'DOCUMENTS_SEARCH',
      entityType: 'DOCUMENT',
      entityId: 'search',
      userId: user.email || 'system',
      userEmail: user.email || 'system@abd.com',
      changedFields: { query: q, limit, offset, count: results.length },
    });

    return NextResponse.json({ results, query: q, limit, offset });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.audit({
      tenantId: 'unknown',
      action: 'DOCUMENTS_SEARCH_ERROR',
      entityType: 'DOCUMENT',
      entityId: 'search',
      userId: 'system',
      userEmail: 'system@abd.com',
      changedFields: { error: err.message },
    });
    console.error('[DOCUMENTS_SEARCH_ERROR]', error);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
