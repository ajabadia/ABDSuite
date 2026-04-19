import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CONFIGURACIÓN INDUSTRIAL - ZERO EXFILTRATION (Aseptic v4)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; " +
                   "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
                   "worker-src 'self' blob:; " +
                   "style-src 'self' 'unsafe-inline'; " +
                   "img-src 'self' blob: data:; " +
                   "font-src 'self' data:; " +
                   "connect-src 'self'; " + // BLOQUEO TOTAL DE RED EXTERNA
                   "frame-src 'self'; " +
                   "object-src 'none'; " +
                   "base-uri 'self'; " +
                   "form-action 'self';"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
