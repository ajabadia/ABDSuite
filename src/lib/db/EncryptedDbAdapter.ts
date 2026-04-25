/**
 * EncryptedDbAdapter - Industrial Standard Decorator.
 * Pure functional approach to avoid DBCore context loss.
 */

import Dexie from 'dexie';
import { CryptoService } from '../services/crypto.service';
import { EncryptedFieldContainer, EncryptedFieldKind } from '../types/crypto.types';

export type EncryptedFieldsConfig = {
  [tableName: string]: string[]; 
};

export const ENCRYPTED_FIELD_KINDS: Record<string, EncryptedFieldKind> = {
  'ABDFN_CORE:operators:mfaSecret': 'text',
  'ABDFN_CORE:coreSettings:encryptedInstallationKey': 'binary',
  'ABDFN_SUITE:lettertemplates_v6:binaryContent': 'binary',
  'ABDFN_SUITE:lettertemplates_v6:content': 'text',
  'ABDFN_SUITE:audit_history_v6:details': 'json',
};

export function applyEncryptedMiddleware(
  db: Dexie,
  schema: 'ABDFN_CORE' | 'ABDFN_SUITE',
  unitId: string | null,
  config: EncryptedFieldsConfig,
  keyProvider: () => CryptoKey | null
) {
  db.use({
    stack: 'dbcore',
    name: 'abdfn-encrypted-middleware',
    create: (core) => {
      return {
        ...core,
        table: (tableName: string) => {
          const originalTable = core.table(tableName);
          const encryptedFields = config[tableName] ?? [];

          if (!originalTable || encryptedFields.length === 0) return originalTable;

          // Industrial Wrapper (Phase 18.2): Use Object.create to preserve prototype & context
          const tableWrapper = Object.create(originalTable);

          tableWrapper.mutate = async (req: any) => {
            const key = keyProvider();
            
            if (req.type === 'add' || req.type === 'put') {
              const newValues = [];
              for (let i = 0; i < req.values.length; i++) {
                const row = { ...req.values[i] };

                if (!row.id) row.id = crypto.randomUUID();
                const id = row.id as string;

                for (const field of encryptedFields) {
                  const rawValue = row[field];
                  if (rawValue == null || isEncryptedContainer(rawValue)) continue;

                  if (key) {
                    const aadContext = { schema, unitId, table: tableName, id, field };
                    const aad = CryptoService.buildAAD(schema, unitId, tableName, id, field);
                    row[field] = await CryptoService.encryptField(rawValue, key!, aad, aadContext);
                  }
                }
                newValues.push(row);
              }
              
              // CRITICAL FIX: Preserve req metadata while updating values
              req = { ...req, values: newValues }; 
            }

            // Direct delegation via original method
            return originalTable.mutate(req);
          };

          tableWrapper.get = async (req: any) => {
            const res = await originalTable.get(req);
            return decryptRow(res, schema, unitId, tableName, encryptedFields, keyProvider);
          };

          tableWrapper.query = async (req: any) => {
            const res = await originalTable.query(req);
            if (res.result) {
              const decryptedResults = [];
              for (const row of res.result) {
                decryptedResults.push(await decryptRow(row, schema, unitId, tableName, encryptedFields, keyProvider));
              }
              res.result = decryptedResults;
            }
            return res;
          };

          return tableWrapper;
        }
      };
    }
  });
}

function isEncryptedContainer(val: any): val is EncryptedFieldContainer {
  return val && typeof val === 'object' && val.v === 1 && val.alg === 'AES-GCM-256' && val.ct;
}

async function decryptRow(
  row: any,
  schema: 'ABDFN_CORE' | 'ABDFN_SUITE',
  unitId: string | null,
  tableName: string,
  encryptedFields: string[],
  keyProvider: () => CryptoKey | null
): Promise<any> {
    if (!row) return row;
    let key: CryptoKey | null = null;

    for (const field of encryptedFields) {
        const value = row[field];
        if (!isEncryptedContainer(value)) continue;

        if (!key) {
            key = keyProvider();
            if (!key) continue;
        }

        const kindKey = `${schema}:${tableName}:${field}`;
        const kind = ENCRYPTED_FIELD_KINDS[kindKey] ?? 'text';
        const aad = CryptoService.buildAAD(schema, unitId, tableName, row.id, field);
        
        try {
            const plainBytes = await CryptoService.decryptField(value, key!, aad);
            if (kind === 'binary') {
                row[field] = plainBytes.buffer; 
            } else {
                const text = new TextDecoder().decode(plainBytes);
                row[field] = text;
            }
        } catch (err: any) {
            if (err.name === 'OperationError') {
                // Try legacy AAD fallback (v0)
                try {
                    const legacyAad = CryptoService.buildAAD(schema, unitId, tableName, row.id, field, false);
                    const plainBytes = await CryptoService.decryptField(value, key!, legacyAad);
                    if (kind === 'binary') row[field] = plainBytes.buffer;
                    else row[field] = new TextDecoder().decode(plainBytes);
                    continue; // Recovery successful
                } catch (v0err) {
                    return row; // Both failed
                }
            }
            return row; 
        }
    }
    return row;
}
