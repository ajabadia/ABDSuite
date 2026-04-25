import type { Metadata, Viewport } from 'next';
import { Space_Mono, Roboto_Mono } from 'next/font/google';
import { LanguageProvider } from '@/lib/context/LanguageContext';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { LogProvider } from '@/lib/context/LogContext';
import { ConfigProvider } from '@/lib/context/ConfigContext';
import { WorkspaceProvider } from '@/lib/context/WorkspaceContext';
import { TelemetryProvider } from '@/lib/context/TelemetryContext';
import { ShellWrapper } from '@/components/shell/ShellWrapper';
import './globals.css';

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
});
const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto-mono',
});

export const metadata: Metadata = {
  title: 'ABDFN SUITE - Aseptic Unified Hub',
  description: 'Procesamiento local seguro y herramientas de integridad. Zero-Knowledge Platform.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ABDFN Suite',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${spaceMono.className} ${spaceMono.variable} ${robotoMono.variable}`} suppressHydrationWarning>
        <LanguageProvider initialLang="es">
          <ThemeProvider>
            <ConfigProvider>
              <TelemetryProvider>
                <WorkspaceProvider>
                  <LogProvider>
                    <div className="crt-overlay" />
                    <ShellWrapper>
                      {children}
                    </ShellWrapper>
                  </LogProvider>
                </WorkspaceProvider>
              </TelemetryProvider>
            </ConfigProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}



