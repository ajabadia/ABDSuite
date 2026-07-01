/**
 * @purpose Proporciona información de salud para el servicio ABDFiles mediante solicitudes HTTP GET.
 * @purpose_en Handles HTTP GET requests to provide health status information for the ABDFiles service.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:1ac3g1n
 * @lastUpdated 2026-06-30T13:35:00.629Z
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'ABDFiles',
    uptime: process.uptime(),
  });
}
