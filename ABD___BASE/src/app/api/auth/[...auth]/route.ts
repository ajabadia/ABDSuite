/**
 * @purpose Gestiona rutas de autenticación para la aplicación utilizando una biblioteca de SDK de satélite.
 * @purpose_en Handles authentication routes for the application using a Satellite SDK.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:1v4vm3j
 * @lastUpdated 2026-07-02T18:43:24.832Z
 */

import { createAuthRouteHandler } from '@ajabadia/satellite-sdk/auth-middleware';
import { NextRequest } from 'next/server';

const handler = createAuthRouteHandler({
  appId: 'base',
  clientId: process.env.AUTH_CLIENT_ID!,
  clientSecret: process.env.AUTH_CLIENT_SECRET!,
  jwtSecret: process.env.AUTH_JWT_SECRET!,
});

export async function GET(request: NextRequest, context: { params: Promise<{ auth: string[] }> }) {
  return handler(request as unknown as Parameters<typeof handler>[0]);
}

export async function POST(request: NextRequest, context: { params: Promise<{ auth: string[] }> }) {
  return handler(request as unknown as Parameters<typeof handler>[0]);
}
