/**
 * @purpose Gestiona el layout raíz para la aplicación Satélite, maneja configuraciones de ubicación, sesión y tema.
 * @purpose_en Renders the root layout for the Satellite App, handling locale, session, and theme configurations.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:9,sig:5gmml7
 * @lastUpdated 2026-06-30T05:48:44.652Z
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { getIndustrialSession } from "@ajabadia/satellite-sdk/auth-middleware";
import { BrandingStyles } from "@ajabadia/satellite-sdk/styles";
import { configureLogger } from '@ajabadia/satellite-sdk/logger';
import { SessionProvider } from "@ajabadia/satellite-sdk/client";

configureLogger({
  endpoint: process.env.LOGS_SERVICE_URL || 'http://localhost:5003/api/logs',
  token: process.env.LOGS_SECRET_TOKEN,
  appId: 'ABD___BASE',
});
import { ThemeProvider } from "@ajabadia/ecosystem-widgets";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Satellite App",
  description: "Generic scaffold satellite application.",
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const session = await getIndustrialSession();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <BrandingStyles />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased navbar-top-layout`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider initialSession={session}>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

