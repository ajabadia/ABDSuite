/**
 * ABDFN Unified Suite - MFA Utilities (Phase 13)
 * Pure Web Crypto implementation of TOTP (RFC 6238).
 */

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30; // seconds
const TOTP_ALGO = 'SHA-1'; // Standard TOTP/HOTP algorithm

/**
 * Generates a random Base32 secret for TOTP.
 */
export function generateTotpSecret(length: number = 20): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // RFC 4648 Base32 alphabet
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += charset[bytes[i] % charset.length];
  }
  return secret;
}

/**
 * Builds an otpauth:// URI for QR generation.
 */
export function buildOtpAuthUri(
  secret: string,
  accountName: string,
  issuer: string = 'ABDFN-SUITE'
): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: TOTP_ALGO.replace('-', ''),
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD)
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Decodes a Base32 string into a Uint8Array.
 */
function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32.replace(/=+$/g, '').toUpperCase();

  let bits = '';
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return new Uint8Array(bytes);
}

/**
 * Generates a TOTP code for a specific time.
 */
async function generateTotpForTime(secret: string, time: number): Promise<string> {
  const counter = Math.floor(time / TOTP_PERIOD);
  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  // Write counter as 64-bit big-endian (RFC 4226)
  view.setUint32(4, counter, false);
  view.setUint32(0, 0, false); // Upper 32 bits are zero for current timestamps

  const secretKeyData = base32ToBytes(secret);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretKeyData as unknown as BufferSource,
    { name: 'HMAC', hash: { name: TOTP_ALGO } },
    false,
    ['sign']
  );

  const hmac = await crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
  const hmacBytes = new Uint8Array(hmac);

  // Dynamic truncation (RFC 4226)
  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
  const binary =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  const otp = (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0');
  return otp;
}

/**
 * Verifies a TOTP token against a secret with window tolerance.
 */
export async function verifyTOTP(
  secret: string,
  token: string,
  window: number = 1 // ±1 period tolerance
): Promise<boolean> {
  if (!/^\d+$/.test(token)) return false;
  const now = Math.floor(Date.now() / 1000);

  for (let offset = -window; offset <= window; offset++) {
    const t = now + offset * TOTP_PERIOD;
    const expected = await generateTotpForTime(secret, t);
    if (expected === token) return true;
  }

  return false;
}
