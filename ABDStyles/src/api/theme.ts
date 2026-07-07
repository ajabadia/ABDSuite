import { generateTenantCss } from '../engine/css-generator.js';

export async function themeRouteHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    const fallbackCss = generateTenantCss({});
    return new Response(fallbackCss, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  try {
    // @ts-ignore
    const sdkDb = await import('@ajabadia/satellite-sdk/db' as any);
    const { connectDB, getGlobalModel } = sdkDb;
    const mongooseMod = await import('mongoose');
    const mongoose = mongooseMod.default || mongooseMod;

    const TenantSchema = new mongoose.Schema(
      { tenantId: String, branding: mongoose.Schema.Types.Mixed },
      { collection: 'tenants' }
    );
    const Tenant = getGlobalModel('Tenant', TenantSchema, 'AUTH');

    await connectDB('ABDStyles');

    const tenant = await Tenant.findOne({ tenantId }).lean() as Record<string, unknown> | null;

    const themeConfig: Record<string, unknown> =
      tenant?.branding && typeof tenant.branding === 'object'
        ? (tenant.branding as Record<string, unknown>)?.theme as Record<string, unknown> || {}
        : {};

    const css = generateTenantCss(themeConfig);

    return new Response(css, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[ABDStyles] Theme API error:', error);
    const fallbackCss = generateTenantCss({});
    return new Response(fallbackCss, {
      status: 500,
      headers: { 'Content-Type': 'text/css' },
    });
  }
}
