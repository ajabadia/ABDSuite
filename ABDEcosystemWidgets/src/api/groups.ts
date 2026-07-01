/**
 * @purpose Gestiona y recupera grupos de permisos para un inquilino, asegurando el acceso industrial y conectándose a la base de datos.
 * @purpose_en Manages and retrieves permission groups for a tenant, ensuring industrial access and connecting to the database.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:4,sig:t75g62
 * @lastUpdated 2026-06-26T06:16:58.865Z
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import mongoose, { Schema, type Model, type Document, type Types } from "mongoose";
import {
  ensureIndustrialAccess,
  connectDB,
  withTenantContext,
  getTenantModel,
} from "@ajabadia/satellite-sdk";

export interface IPermissionGroup extends Document {
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: Types.ObjectId;
  policyIds: Types.ObjectId[];
  allowedApps: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PermissionGroupSchema = new Schema<IPermissionGroup>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: "PermissionGroup", index: true },
    policyIds: [{ type: Schema.Types.ObjectId, ref: "PermissionPolicy" }],
    allowedApps: [{ type: String }],
  },
  { timestamps: true }
);

PermissionGroupSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

function getGroupModel(): Model<IPermissionGroup> {
  return getTenantModel<IPermissionGroup>("PermissionGroup", PermissionGroupSchema);
}

export async function GET(request: NextRequest) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess();
      await connectDB();

      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get("tenantId") || user.tenantId;

      const model = getGroupModel();
      const rawDocs = await model
        .find({ tenantId })
        .sort({ name: 1 })
        .lean() as any[];

      const normalized = rawDocs.map((g: any) => ({
        _id: String(g._id),
        id: String(g._id),
        name: g.name,
        slug: g.slug,
        description: g.description || "",
        tenantId: g.tenantId,
        parentId: g.parentId ? String(g.parentId) : null,
        policyIds: (g.policyIds || []).map((id: any) => String(id)),
        allowedApps: g.allowedApps || [],
      }));

      return NextResponse.json({ data: normalized });
    } catch (error: unknown) {
      console.error("[API_GET_GROUPS_ERROR]", error);
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
