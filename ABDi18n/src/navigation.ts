/**
 * @purpose Gestiona navegación dentro de la aplicación utilizando `next-intl` para internacionalización.
 * @purpose_en Manages navigation within the application using `next-intl` for internationalization.
 * @refactorable false
 * @classification Custom Hook
 * @complexity Low
 * @fingerprint exports:4,imports:2,sig:i2ffis
 * @lastUpdated 2026-06-29T22:23:48.900Z
 */

import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing.js';

const nav = createNavigation(routing);

type NavigateOptions = { locale?: string; scroll?: boolean };

export const Link = nav.Link;

export function redirect(href: string | { href: string; locale?: string; scroll?: boolean }): never {
  return nav.redirect(href as any);
}

export const usePathname: () => string = nav.usePathname;

export const useRouter: () => {
  push: (href: string, options?: NavigateOptions) => void;
  replace: (href: string, options?: NavigateOptions) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string) => void;
} = nav.useRouter;
