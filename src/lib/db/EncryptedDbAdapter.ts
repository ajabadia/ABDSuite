/**
 * EncryptedDbAdapter - Dexie Middleware for Transparent field-level encryption.
 * Implementing Base standards for at-rest protection (v1).
 */

import Dexie from 'dexie';
import { CryptoService } from '../services/crypto.service';
import { EncryptedFieldContainer, EncryptedFieldKind } from '../types/crypto.types';

export type EncryptedFieldsConfig = {
  [tableName: string]: string[]; // List of fields to encrypt in this table
};

export const ENCRYPTED_FIELD_KINDS: Record<string, EncryptedFieldKind> = {
  // CORE
  'ABDFN_CORE:operators:mfaSecret': 'text',
  'ABDFN_CORE:coreSettings:encryptedInstallationKey': 'binary',

  // SUITE (per unit)
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
        table: (tableName) => {
          const table = core.table(tableName);
          const encryptedFields = config[tableName] ?? [];

          if (encryptedFields.length === 0) return table;

          return {
            ...table,
            mutate: async (req) => {
              // FOR WRITES: We require the IK to be unlocked.
              // Exception: The Bootstrap might need to write the IK itself (initial wrap).
              // We'll manage that by ensuring the Master Key is available during Bootstrap.
              const key = keyProvider();
              
              if ((req.type === 'add' || req.type === 'put')) {
                // If writing to coreSettings:encryptedInstallationKey, we might not have the IK yet 
                // because we are SAVING it. But the value passed will already be an EncryptedFieldContainer.
                for (const row of req.values) {
                  // 1. Ensure record has an ID for stable AAD
                  if (!row.id) {
                    row.id = crypto.randomUUID();
                  }
                  const id = row.id as string;

                  for (const field of encryptedFields) {
                    const rawValue = row[field];
                    if (rawValue == null) continue;

                    // 2. Compatibility: If it's already an EncryptedFieldContainer, skip encryption.
                    // This allows the Bootstrap to manually wrap the IK and then the middleware just persists it.
                    if (isEncryptedContainer(rawValue)) continue;

                    if (!key) {
                        console.error(`[DB-ENCRYPT] Cannot encrypt field ${tableName}.${field} - IK locked.`);
                        throw new Error('ENCRYPTION_ENGINE_LOCKED');
                    }

                    const aad = CryptoService.buildAAD(schema, unitId, tableName, id, field);
                    row[field] = await CryptoService.encryptField(rawValue, key, aad);
                  }
                }
              }

              return table.mutate(req);
            },
            get: async (req) => {
              const res = await table.get(req);
              return decryptRow(res, schema, unitId, tableName, encryptedFields, keyProvider);
            },
            query: async (req) => {
              const res = await table.query(req);
              if (res.result) {
                // We perform decryption on the results array
                const decryptedResults = [];
                for (const row of res.result) {
                    decryptedResults.push(await decryptRow(row, schema, unitId, tableName, encryptedFields, keyProvider));
                }
                res.result = decryptedResults;
              }
              return res;
            }
          };
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

    // IMPORTANT: If we are reading fields that ARE NOT EncryptedContainers,
    // we return them as-is (backward compatibility).
    
    // We only need the key if we actually find a container to decrypt.
    let key: CryptoKey | null = null;

    for (const field of encryptedFields) {
        const value = row[field];
        if (!isEncryptedContainer(value)) continue;

        // Container found -> We MUST have the key now
        if (!key) {
            key = keyProvider();
            if (!key) {
                // Return row but keep containers encrypted? 
                // Or throw error? Industrial preference: throw error if we expect to use the data.
                console.warn(`[DB-ENCRYPT] Accessing encrypted row ${tableName}.${row.id} but engine is LOCKED.`);
                throw new Error('ENCRYPTION_ENGINE_LOCKED');
            }
        }

        const kindKey = `${schema}:${tableName}:${field}`;
        const kind = ENCRYPTED_FIELD_KINDS[kindKey] ?? 'text';
        const aad = CryptoService.buildAAD(schema, unitId, tableName, row.id, field);
        
        try {
            const plainBytes = await CryptoService.decryptField(value, key!, aad);
            
            if (kind === 'binary') {
                row[field] = plainBytes.buffer; // We return ArrayBuffer for broader compatibility
            } else {
                const text = new TextDecoder().decode(plainBytes);
                if (kind === 'json') {
                    // If your app expects an object, parse it.
                    // For now, details is a string holding JSON, so we leave it as string.
                    row[field] = text;
                } else {
                    row[field] = text;
                }
            }
        } catch (err) {
            console.error(`[DB-ENCRYPT] Decryption failed for ${tableName}.${row.id}.${field}`, err);
            throw new Error('DECRYPTION_FAILED');
        }
    }

    return row;
}
