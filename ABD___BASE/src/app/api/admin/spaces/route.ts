/**
 * @purpose Gestiona solicitudes GET para datos de espacios.
 * @purpose_en Handles GET requests for spaces data.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:19kk0vu
 * @lastUpdated 2026-06-21T08:41:00.562Z
 */

import { GET as getHandler } from "@ajabadia/ecosystem-widgets/api/spaces";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return getHandler(request as any);
}
