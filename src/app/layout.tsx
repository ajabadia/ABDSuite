import type { Metadata } from 'next';
import { Space_Mono, Roboto_Mono } from 'next/font/google';
import { LanguageProvider } from '@/lib/context/LanguageContext';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { StatusBar } from '@/components/shell/StatusBar';
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
            <div className="crt-overlay" />
            <div className="shell-container">
              <Sidebar />
              <TopBar />
              <main className="shell-content">
                {children}
              </main>
              <StatusBar />
            </div>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
