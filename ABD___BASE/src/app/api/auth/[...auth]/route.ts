/**
 * @purpose Gestiona rutas de autenticación para la aplicación utilizando una biblioteca de SDK de satélite.
 * @purpose_en Handles authentication routes for the application using a Satellite SDK.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:ata7kh
 * @lastUpdated 2026-06-21T08:41:08.102Z
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
  return handler(request as any);
}

export async function POST(request: NextRequest, context: { params: Promise<{ auth: string[] }> }) {
  return handler(request as any);
}
