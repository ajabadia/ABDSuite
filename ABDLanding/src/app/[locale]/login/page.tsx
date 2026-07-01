/**
 * @purpose Redirige al proveedor de autenticación federado para iniciar sesión.
 * @purpose_en Redirects the user to the federated authentication provider for signing in.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:1bkwj5k
 * @lastUpdated 2026-07-01T12:17:02.977Z
 */

import { redirect } from 'next/navigation';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const providerUrl = process.env.AUTH_PROVIDER_URL || 'http://localhost:5001';
  const clientId = process.env.AUTH_CLIENT_ID || 'landing';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';

  const authorizeUrl = new URL(`${providerUrl}/api/auth/federated/authorize`);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', `${appUrl}/api/abd-auth/federated/callback`);
  authorizeUrl.searchParams.set('state', `/${locale}`);

  redirect(authorizeUrl.toString());
}
