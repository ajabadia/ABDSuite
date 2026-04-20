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
      passwordBytes.buffer as ArrayBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive the actual AES-GCM key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
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
        iv: nonce,
        tagLength: TAG_SIZE * 8
      },
      key,
      fileBytes
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
          iv: nonce.buffer as ArrayBuffer,
          tagLength: TAG_SIZE * 8
        },
        key,
        combinedData.buffer as ArrayBuffer
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
    aad?: Uint8Array
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
        iv: iv.buffer as ArrayBuffer,
        additionalData: aad ? (aad.buffer as ArrayBuffer) : undefined,
        tagLength: TAG_SIZE * 8
      },
      key,
      plainBytes.buffer as ArrayBuffer
    );

    return {
      v: 1,
      alg: 'AES-GCM-256',
      iv: this.toBase64(iv),
      ct: this.toBase64(new Uint8Array(cipherBuf)),
      aad: aad ? this.toBase64(aad) : undefined
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

    const plainBuf = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer as ArrayBuffer,
        additionalData: aad ? (aad.buffer as ArrayBuffer) : undefined,
        tagLength: TAG_SIZE * 8
      },
      key,
      ct.buffer as ArrayBuffer
    );

    return new Uint8Array(plainBuf);
  }

  /**
   * Builds the Additional Authenticated Data (AAD) for a record field.
   */
  public static buildAAD(
    schema: 'ABDFN_CORE' | 'ABDFN_SUITE',
    unitId: string | null,
    table: string,
    id: string,
    field: string
  ): Uint8Array {
    const payload: AADPayload = { schema, unitId, table, id, field, v: 1 };
    return new TextEncoder().encode(JSON.stringify(payload));
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
