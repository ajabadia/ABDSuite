import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ajabadia/ecosystem-widgets', '@ajabadia/styles', '@ajabadia/satellite-sdk', 'next-intl'],
  async rewrites() {
    return [
      {
        source: '/:locale/auth/:path*',
        destination: `${process.env.AUTH_PROVIDER_URL || 'https://auth.abdia.es'}/:locale/:path*`,
      },
      {
        source: '/:locale/quiz/:path*',
        destination: `${process.env.QUIZ_URL || 'https://quiz.abdia.es'}/:locale/:path*`,
      },
      {
        source: '/:locale/gobernanza/:path*',
        destination: `${process.env.GOVERNANCE_URL || 'https://tenantgovernance.abdia.es'}/:locale/:path*`,
      },
      {
        source: '/:locale/files/:path*',
        destination: `${process.env.FILES_URL || 'https://files.abdia.es'}/:locale/:path*`,
      },
      {
        source: '/:locale/analytics/:path*',
        destination: `${process.env.ANALYTICS_URL || 'https://analytics.abdia.es'}/:locale/:path*`,
      },
      {
        source: '/:locale/logs/:path*',
        destination: `${process.env.LOGS_URL || 'https://logs.abdia.es'}/:locale/:path*`,
      },
      // Non-localized routes (API, static, etc.)
      {
        source: '/auth/:path*',
        destination: `${process.env.AUTH_PROVIDER_URL || 'https://auth.abdia.es'}/:path*`,
      },
      {
        source: '/quiz/:path*',
        destination: `${process.env.QUIZ_URL || 'https://quiz.abdia.es'}/:path*`,
      },
      {
        source: '/gobernanza/:path*',
        destination: `${process.env.GOVERNANCE_URL || 'https://tenantgovernance.abdia.es'}/:path*`,
      },
      {
        source: '/files/:path*',
        destination: `${process.env.FILES_URL || 'https://files.abdia.es'}/:path*`,
      },
      {
        source: '/analytics/:path*',
        destination: `${process.env.ANALYTICS_URL || 'https://analytics.abdia.es'}/:path*`,
      },
      {
        source: '/logs/:path*',
        destination: `${process.env.LOGS_URL || 'https://logs.abdia.es'}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
