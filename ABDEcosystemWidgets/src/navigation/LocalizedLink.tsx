'use client';

/**
 * @purpose Renderiza un enlace localizado que maneja tanto rutas internas de Next.js como URLs externas, aplicando un transformador de href opcional para prefixar el prefijo de idioma o reescribir la ruta.
 * @purpose_en Renders a localized link that handles both internal Next.js routes and external URLs, applying an optional href transformer for locale prefixing or path rewriting.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1ozjqct
 * @lastUpdated 2026-06-23T23:02:05.770Z
 */

import Link from 'next/link';
import type { ReactNode, MouseEventHandler } from 'react';

interface LocalizedLinkProps {
  href: string;
  transformHref?: (href: string) => string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  className?: string;
  title?: string;
  children: ReactNode;
  'data-testid'?: string;
}

/**
 * Renders a localized link that handles both internal Next.js routes
 * and external URLs (http/https). Applies an optional href transformer
 * for locale prefixing or path rewriting.
 */
export function LocalizedLink({
  href,
  transformHref = (h: string) => h,
  onClick,
  className,
  title,
  children,
  'data-testid': dataTestId,
}: LocalizedLinkProps) {
  const finalHref = transformHref(href);
  const isExternal = finalHref.startsWith('http://') || finalHref.startsWith('https://');

  if (isExternal) {
    return (
      <a href={finalHref} onClick={onClick} className={className} title={title} data-testid={dataTestId}>
        {children}
      </a>
    );
  }

  if (onClick) {
    return (
      <Link href={finalHref} className={className} onClick={onClick} title={title} data-testid={dataTestId}>
        {children}
      </Link>
    );
  }

  return (
    <Link href={finalHref} className={className} title={title} data-testid={dataTestId}>
      {children}
    </Link>
  );
}
