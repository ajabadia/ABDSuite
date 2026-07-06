import { getRequestConfig } from 'next-intl/server';
import { routing } from '@ajabadia/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  const { locales: allMessages } = await import('@ajabadia/i18n');
  const messages = JSON.parse(JSON.stringify(allMessages[locale as keyof typeof allMessages]));

  if (messages.common) {
    messages.common.brandPart2 = 'QUIZ';
  }

  return {
    locale,
    messages,
    timeZone: 'Europe/Madrid',
  };
});
