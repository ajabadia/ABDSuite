/**
 * @purpose Gestiona autenticación y internacionalización para rutas en la aplicación ABDFiles utilizando middleware de Next.js.
 * @purpose_en Manages authentication and internationalization for routes in the ABDFiles application using Next.js middleware.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:4,sig:1a9g078
 * @lastUpdated 2026-07-01T08:40:51.668Z
 */

import { withIndustrialAuth } from '@ajabadia/satellite-sdk/auth-middleware';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const proxy = withIndustrialAuth({
  appId: process.env.NEXT_PUBLIC_APP_ID as string,
  clientId: process.env.AUTH_CLIENT_ID as string,
  clientSecret: process.env.AUTH_CLIENT_SECRET || '',
  jwtSecret: process.env.AUTH_JWT_SECRET!,
  publicPaths: ['/', '/logout-success'],
  intlMiddleware: intlMiddleware as unknown as never,
});

export default async function middleware(request: NextRequest) {
  const response = await proxy(request);
  if (response.headers.get('content-type')?.includes('text/html')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' *; object-src 'none'; base-uri 'self'; form-action 'self'"
    );
  }
  return response;
}

export const config = {
  // Intercept all routes except api, static resources, and images
  matcher: ['/((?!api|_next/static|_next/image|.*\\.svg$).*)'],
};
