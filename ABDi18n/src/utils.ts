/**
 * @purpose Gestiona configuraciones locales y forma fechas.
 * @purpose_en Manages locale settings and formats dates.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:3,imports:0,sig:1lm0svn
 * @lastUpdated 2026-06-29T22:23:52.693Z
 */

export function setLocaleCookie(newLocale: string): void {
  let domainSuffix = "";
  const hostname = window.location.hostname;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      domainSuffix = `; domain=.${parts.slice(-2).join('.')}`;
    }
  }
  document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax${domainSuffix}`;
}

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
  locale = 'es'
): string {
  const d = new Date(date);
  return d.toLocaleString(locale, options);
}

export function buildLocaleToggleHandler(
  currentLocale: string,
  router: { replace: (href: string, opts?: Record<string, unknown>) => void },
  pathname: string
): () => void {
  return () => {
    const nextLocale = currentLocale === 'es' ? 'en' : 'es';
    setLocaleCookie(nextLocale);
    router.replace(pathname, { locale: nextLocale });
  };
}
