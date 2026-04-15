/**
 * Common Crypto Utilities for ABDFN Suite.
 * Implementation of industrial-strength algorithms in pure JS for zero-knowledge environments.
 */

/**
 * Calculates a standard MD5 hash (32 hex characters).
 * Optimized for performance and parity with legacy industrial witnesses.
 */
export function md5(text: string): string {
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];
  
  const k = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296));
  
  const rotateLeft = (l: number, r: number) => (l << r) | (l >>> (32 - r));

  const msg = new TextEncoder().encode(text);
  const words = new Int32Array(((msg.length + 8) >> 6 << 4) + 16);
  for (let i = 0; i < msg.length; i++) words[i >> 2] |= msg[i] << (i % 4 << 3);
  words[msg.length >> 2] |= 0x80 << (msg.length % 4 << 3);
  words[words.length - 2] = msg.length << 3;
  
  let h0 = 1732584193;
  let h1 = -271733879;
  let h2 = -1732584194;
  let h3 = 271733878;
  
  for (let i = 0; i < words.length; i += 16) {
    let a = h0, b = h1, c = h2, d = h3;
    for (let j = 0; j < 64; j++) {
      let f, g;
      if (j < 16) {
        f = (b & c) | (~b & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * j) % 16;
      }
      const tmp = d;
      d = c;
      c = b;
      b = (b + rotateLeft((a + f + k[j] + words[i + g]), s[j])) | 0;
      a = tmp;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
  }
  
  const toHex = (n: number) => ('00000000' + (n >>> 0).toString(16)).slice(-8).match(/../g)!.reverse().join('');
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3);
}
