/**
 * MFA Utilities for ABDFN Suite (Phase 9)
 * Implementation of RFC 6238 (TOTP) and RFC 4648 (Base32) using Web Crypto API.
 * High-security, zero-dependency industrial authenticaton.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generates a random Base32 secret for MFA enrollment.
 */
export function generateMfaSecret(length = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

/**
 * Decodes a Base32 string into a Uint8Array.
 */
function base32Decode(base32: string): Uint8Array {
  const normalized = base32.toUpperCase().replace(/=+$/, '');
  const len = normalized.length;
  const res = new Uint8Array(((len * 5) / 8) | 0);
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < len; i++) {
    const val = BASE32_ALPHABET.indexOf(normalized[i]);
    if (val === -1) throw new Error('INVALID_BASE32_CHARACTER');
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      res[index++] = (value >> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return res;
}

/**
 * Calculates HMAC-SHA1 using Web Crypto Subtle API.
 */
async function hmacSha1(keyData: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

/**
 * Generates a 6-digit TOTP code for a given Base32 secret.
 * @param secret Base32 encoded secret key
 * @param window Step window (default 30s)
 */
export async function generateTOTP(secret: string, time = Date.now()): Promise<string> {
  const key = base32Decode(secret);
  const epoch = Math.floor(time / 1000);
  const counter = Math.floor(epoch / 30);

  // Counter as 8-byte big-endian
  const counterBuffer = new Uint8Array(8);
  let tempCounter = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = tempCounter & 0xff;
    tempCounter = tempCounter >> 8;
  }

  const hmac = await hmacSha1(key, counterBuffer);
  const offset = hmac[hmac.length - 1] & 0x0f;
  
  const token = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return token.toString().padStart(6, '0');
}

/**
 * Verifies a TOTP code against a secret.
 * Supports a ±1 window (30s before/after) to account for clock drift.
 */
export async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const now = Date.now();
  const windows = [0, -30000, 30000]; // current, -1, +1

  for (const drift of windows) {
    const generated = await generateTOTP(secret, now + drift);
    if (generated === code) return true;
  }
  return false;
}

/**
 * Generates an otpauth:// URI for enrollment.
 */
export function generateMfaUri(label: string, secret: string, issuer = 'ABDFN_Suite'): string {
  const encodedLabel = encodeURIComponent(`${issuer}:${label}`);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Industrial Aseptic QR Generator (Simplified SVG for TOTP URIs)
 * To avoid external deps, we implement a basic QR-style visualization or 
 * a high-density data matrix if needed. For Phase 9, a simple SVG "Simu-QR"
 * or a tiny vendorized QR logic is best.
 * 
 * NOTE: For full production, a vendorized 'qrcode' library is recommended.
 * Here we provide the URI and a placeholder UX to be replaced by 
 * a proper generator in the next step.
 */
export function getMfaQrPlaceholder(uri: string): string {
  // TODO: Implement actual SVG QR generation logic in a separate component/utility
  return uri;
}
