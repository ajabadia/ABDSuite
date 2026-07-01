/**
 * @purpose Gestiona rutas de autenticación para la aplicación utilizando un manejo de excepciones.
 * @purpose_en Manages authentication routes for the application using a catch-all handler.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:gaq7hy
 * @lastUpdated 2026-06-23T22:36:55.901Z
 */

import { createAuthRouteHandler } from '@ajabadia/satellite-sdk/auth-middleware';
import { NextRequest } from 'next/server';

/**
 * 🛰️ Catch-All SSO Auth Route Handler
 * Manages /api/auth/session, /api/auth/logout, and /api/auth/federated/callback dynamically.
 */
const handler = createAuthRouteHandler({
  appId: process.env.NEXT_PUBLIC_APP_ID as string,
  clientId: process.env.AUTH_CLIENT_ID as string,
  clientSecret: process.env.AUTH_CLIENT_SECRET || '',
  jwtSecret: process.env.AUTH_JWT_SECRET!,
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
