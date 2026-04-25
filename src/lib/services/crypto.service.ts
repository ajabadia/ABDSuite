/**
 * CryptoService - Web Crypto Implementation of the ABDFN Encryption Standard.
 * 
 * Replicates the logic of ABDTools.Core.Crypto.CryptoService to ensure 
 * 100% compatibility with files encrypted via the original C# utility.
 */

const SALT_SIZE = 16;      // 128-bit
const NONCE_SIZE = 12;     // 96-bit (GCM standard)
const KEY_SIZE = 32;       // AES-256
const TAG_SIZE = 16;       // 128-bit (GCM standard)
const ITERATIONS = 100000; // PBKDF2 iterations (matching C#)

import { EncryptedFieldContainer, AADPayload } from '../types/crypto.types';

export interface ProcessingResult {
  success: boolean;
  fileName: string;
  error?: string;
  skipped?: boolean;
}

export class CryptoService {
  /**
   * Derives a 256-bit key from a password and salt using PBKDF2.
   */
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    // Import the raw password as a key for PBKDF2
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBytes as any,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive the actual AES-GCM key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: KEY_SIZE * 8 },
      false, // Key is not extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts a file using AES-256-GCM.
   * Structure: [Salt(16)] + [Nonce(12)] + [Ciphertext] + [Tag(16)] 
   * NOTE: Web Crypto appends the tag to the ciphertext.
   */
  public static async encryptFile(file: File, password: string): Promise<Blob> {
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    
    // 1. Generate random Salt and Nonce
    const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_SIZE));

    // 2. Derive Key
    const key = await this.deriveKey(password, salt);

    // 3. Encrypt
    // For GCM, the 'tag' is automatically appended to the ciphertext by encrypt()
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce as any,
        tagLength: TAG_SIZE * 8
      },
      key,
      fileBytes as any
    );

    // 4. Assemble: [Salt][Nonce][Ciphertext+Tag]
    // Web Crypto's encryptedContent = [Ciphertext][Tag] (16 bytes at the end)
    // Actually, C# code wrote: [Salt][Nonce][Tag][Ciphertext]
    // We MUST match the C# order exactly: [Salt][Nonce][Tag][Ciphertext]
    
    const encryptedArray = new Uint8Array(encryptedContent);
    const tag = encryptedArray.slice(-TAG_SIZE);
    const ciphertextOnly = encryptedArray.slice(0, -TAG_SIZE);

    const finalResult = new Uint8Array(SALT_SIZE + NONCE_SIZE + TAG_SIZE + ciphertextOnly.length);
    finalResult.set(salt, 0);
    finalResult.set(nonce, SALT_SIZE);
    finalResult.set(tag, SALT_SIZE + NONCE_SIZE);
    finalResult.set(ciphertextOnly, SALT_SIZE + NONCE_SIZE + TAG_SIZE);

    return new Blob([finalResult], { type: 'application/octet-stream' });
  }

  /**
   * Decrypts a file using AES-256-GCM.
   */
  public static async decryptFile(file: File, password: string): Promise<Blob> {
    const data = new Uint8Array(await file.arrayBuffer());
    
    const minSize = SALT_SIZE + NONCE_SIZE + TAG_SIZE;
    if (data.length < minSize) {
      throw new Error('Archivo demasiado corto o formato incorrecto.');
    }

    // 1. Extract components (matching C# order: Salt, Nonce, Tag, Ciphertext)
    const salt = data.slice(0, SALT_SIZE);
    const nonce = data.slice(SALT_SIZE, SALT_SIZE + NONCE_SIZE);
    const tag = data.slice(SALT_SIZE + NONCE_SIZE, SALT_SIZE + NONCE_SIZE + TAG_SIZE);
    const ciphertext = data.slice(SALT_SIZE + NONCE_SIZE + TAG_SIZE);

    // 2. Derive Key
    const key = await this.deriveKey(password, salt);

    // 3. Web Crypto expects [Ciphertext][Tag] concatenated for decryption
    const combinedData = new Uint8Array(ciphertext.length + TAG_SIZE);
    combinedData.set(ciphertext, 0);
    combinedData.set(tag, ciphertext.length);

    // 4. Decrypt
    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: nonce as any,
          tagLength: TAG_SIZE * 8
        },
        key,
        combinedData as any
      );

      return new Blob([decryptedBuffer], { type: 'application/octet-stream' });
    } catch (e) {
      throw new Error('Contraseña incorrecta o archivo dañado.');
    }
  }

  // --- PHASE 14: AT-REST ENCRYPTION (FIELD LEVEL) ---

  /**
   * Generates a new random 256-bit Installation Key (IK).
   */
  public static async generateInstallationKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true, // Must be extractable to be wrapped/stored
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derives a Master Key from a PIN for wrapping/unwrapping the Installation Key.
   */
  public static async deriveMasterKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    return this.deriveKey(pin, salt);
  }

  /**
   * Encrypts a field value (string or binary) using the provided key and optional AAD.
   */
  public static async encryptField(
    value: string | ArrayBuffer | Uint8Array,
    key: CryptoKey,
    aad?: Uint8Array,
    aadContext?: Partial<AADPayload>
  ): Promise<EncryptedFieldContainer> {
    let plainBytes: Uint8Array;
    if (typeof value === 'string') {
      plainBytes = new TextEncoder().encode(value);
    } else if (value instanceof ArrayBuffer) {
      plainBytes = new Uint8Array(value);
    } else {
      plainBytes = value;
    }

    const iv = crypto.getRandomValues(new Uint8Array(NONCE_SIZE));

    const cipherBuf = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
        additionalData: aad as any,
        tagLength: TAG_SIZE * 8
      },
      key,
      plainBytes as any
    );

    return {
      v: 1,
      alg: 'AES-GCM-256',
      iv: this.toBase64(iv),
      ct: this.toBase64(new Uint8Array(cipherBuf)),
      aad: aad ? this.toBase64(aad) : undefined,
      aad_context: aadContext
    };
  }

  /**
   * Decrypts a field container using the provided key and optional AAD.
   */
  public static async decryptField(
    container: EncryptedFieldContainer,
    key: CryptoKey,
    aad?: Uint8Array
  ): Promise<Uint8Array> {
    if (container.v !== 1 || container.alg !== 'AES-GCM-256') {
      throw new Error('Unsupported encrypted field format or algorithm.');
    }

    const iv = this.fromBase64(container.iv);
    const ct = this.fromBase64(container.ct);

    try {
      // Primary Attempt: Use provided AAD
      const plainBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any, additionalData: aad as any, tagLength: TAG_SIZE * 8 },
        key,
        ct as any
      );
      return new Uint8Array(plainBuf);
    } catch (err: any) {
      // Secondary Recovery: Brute-force probable AAD candidates if it's an integrity error
      if (err.name === 'OperationError') {
        const context = container.aad_context;
        if (context) {
          const candidates = this.getAADPermutations(
            context.schema as any, 
            context.unitId as any, 
            context.table as any, 
            context.id as any, 
            context.field as any
          );
          
          for (const candidate of candidates) {
            try {
              const plainBuf = await crypto.subtle.decrypt(
                { 
                  name: 'AES-GCM', 
                  iv: iv as any, 
                  additionalData: candidate.bytes.length === 0 ? undefined : candidate.bytes as any, 
                  tagLength: TAG_SIZE * 8 
                },
                key,
                ct as any
              );
              console.warn(`[ABDFN-CRYPTO] Recovery successful via AAD permutation: ${candidate.label}`);
              return new Uint8Array(plainBuf);
            } catch {
              continue; // Try next candidate
            }
          }
        }
      }
      throw err;
    }
  }

  public static buildAAD(
    schema: 'ABDFN_CORE' | 'ABDFN_SUITE',
    unitId: string | null,
    table: string,
    id: string,
    field: string,
    includeVersion = true
  ): Uint8Array {
    const payload: any = { schema, unitId, table, id, field };
    if (includeVersion) payload.v = 1;
    return new TextEncoder().encode(JSON.stringify(payload));
  }

  /**
   * Generates multiple AAD candidates to recover from past schema evolutions.
   */
  public static getAADPermutations(
    schema: 'ABDFN_CORE' | 'ABDFN_SUITE',
    unitId: string | null,
    table: string,
    id: string,
    field: string
  ): { label: string; bytes: Uint8Array }[] {
    const encoder = new TextEncoder();
    const candidates: { label: string; bytes: Uint8Array }[] = [];

    // 1. V1 (Deterministic JSON)
    candidates.push({ label: 'V1_JSON', bytes: this.buildAAD(schema, unitId, table, id, field, true) });

    // 2. V0 (Legacy JSON with nulls)
    candidates.push({ label: 'V0_JSON_NULL', bytes: this.buildAAD(schema, unitId, table, id, field, false) });

    // 3. V0-Compact (Omit key if null)
    let payloadCompact: any = { schema, table, id, field };
    if (unitId) payloadCompact.unitId = unitId;
    candidates.push({ label: 'V0_JSON_COMPACT', bytes: encoder.encode(JSON.stringify(payloadCompact)) });

    // 4. V0-Alphabetical (Order check)
    const payloadAlpha: any = { field, id, schema, table };
    if (unitId !== undefined) payloadAlpha.unitId = unitId;
    candidates.push({ label: 'V0_JSON_ALPHA', bytes: encoder.encode(JSON.stringify(payloadAlpha)) });

    // 5. V0-Null-String (Explicit "null" text)
    const payloadNullStr: any = { schema, unitId: "null", table, id, field };
    candidates.push({ label: 'V0_JSON_NULL_STR', bytes: encoder.encode(JSON.stringify(payloadNullStr)) });

    // 6. V0-Concatenated (The "Colon" protocol)
    const rawStr = `${schema}:${unitId || ''}:${table}:${id}:${field}`;
    candidates.push({ label: 'V0_CONCAT', bytes: encoder.encode(rawStr) });

    // 7. V0-Concatenated-Compact (Skip unitId segment)
    const rawStrCompact = `${schema}:${table}:${id}:${field}`;
    candidates.push({ label: 'V0_CONCAT_COMPACT', bytes: encoder.encode(rawStrCompact) });

    // 8. NO_AAD (Early ERA 6 fallback)
    candidates.push({ label: 'NO_AAD', bytes: new Uint8Array(0) });

    return candidates;
  }

  // --- HELPERS ---

  public static toBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }

  public static fromBase64(b64: string): Uint8Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  }
}
