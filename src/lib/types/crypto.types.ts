/**
 * ABDFN Unified Suite - Cryptographic Types (Phase 14)
 * Standard structures for At-Rest Encryption.
 */

export interface EncryptedFieldContainer {
  v: 1;                 // Version number for future evolution
  alg: 'AES-GCM-256';   // Standard algorithm
  iv: string;           // Initialization Vector (Base64)
  ct: string;           // Ciphertext + Auth Tag (Base64)
  aad?: string;         // Additional Authenticated Data (Base64) - Optional context
}

export type EncryptedFieldKind = 'binary' | 'text' | 'json';

/**
 * Context payload for Additional Authenticated Data (AAD)
 * Prevents "record-swapping" attacks by tying the blob to its record identity.
 */
export interface AADPayload {
  schema: 'ABDFN_CORE' | 'ABDFN_SUITE';
  unitId?: string | null;
  table: string;
  id: string;
  field: string;
  v: 1;
}
