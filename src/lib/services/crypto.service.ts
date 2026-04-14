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
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive the actual AES-GCM key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as any, // Cast to any to avoid TypeScript type mismatch with SharedArrayBuffer on Vercel
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
          iv: nonce,
          tagLength: TAG_SIZE * 8
        },
        key,
        combinedData
      );

      return new Blob([decryptedBuffer], { type: 'application/octet-stream' });
    } catch (e) {
      throw new Error('Contraseña incorrecta o archivo dañado.');
    }
  }
}
