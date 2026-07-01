/**
 * @purpose Gestiona y recupera datos espaciales para la aplicación ABDEcosystemWidgets, asegurando el acceso industrial y conectándose a la base de datos.
 * @purpose_en Manages and retrieves space data for the ABDEcosystemWidgets application, ensuring industrial access and connecting to the database.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:4,sig:5emgug
 * @lastUpdated 2026-06-26T06:17:03.362Z
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import mongoose, { Schema, type Model, type Document } from "mongoose";
import {
  ensureIndustrialAccess,
  connectDB,
  withTenantContext,
  getTenantModel,
} from "@ajabadia/satellite-sdk";

export interface ISpace extends Document {
  name: string;
  slug: string;
  description?: string;
  type: "TENANT" | "TEAM" | "PERSONAL";
  tenantId: string;
  ownerUserId?: string;
  parentSpaceId?: string;
  materializedPath?: string;
  visibility: "PUBLIC" | "INTERNAL" | "PRIVATE";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SpaceSchema = new Schema<ISpace>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["TENANT", "TEAM", "PERSONAL"],
      default: "TENANT",
    },
    tenantId: { type: String, required: true, index: true },
    ownerUserId: { type: String },
    parentSpaceId: { type: String, index: true },
    materializedPath: { type: String, index: true },
    visibility: {
      type: String,
      enum: ["PUBLIC", "INTERNAL", "PRIVATE"],
      default: "INTERNAL",
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

SpaceSchema.index({ tenantId: 1, parentSpaceId: 1, slug: 1 }, { unique: true });

function getSpaceModel(): Model<ISpace> {
  return getTenantModel<ISpace>("Space", SpaceSchema);
}

export async function GET(request: NextRequest) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess();
      await connectDB();

      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get("tenantId") || user.tenantId;

      const model = getSpaceModel();
      const rawDocs = await model
        .find({ tenantId, isActive: true })
        .sort({ name: 1 })
        .lean() as any[];

      const normalized = rawDocs.map((s: any) => ({
        _id: String(s._id),
        id: String(s._id),
        name: s.name,
        slug: s.slug,
        type: s.type,
        tenantId: s.tenantId,
        parentSpaceId: s.parentSpaceId || null,
        visibility: s.visibility,
      }));

      return NextResponse.json({ data: normalized });
    } catch (error: unknown) {
      console.error("[API_GET_SPACES_ERROR]", error);
      const err = error as Error;
      const status =
        err.message === "UNAUTHORIZED_ECOSYSTEM_ACCESS" ? 403 : 500;
      return NextResponse.json(
        { error: err.message || "Unauthorized" },
        { status }
      );
    }
  });
}
