/**
 * @purpose Gestiona un esquema de Mongoose y modelo para rastrear datos de análisis de gobernanza, incluyendo métricas específicas del teniente como espacios creados, colaboradores, aplicaciones licenciadas y utilización de espacios.
 * @purpose_en Defines a Mongoose schema and model for tracking governance analytics data, including tenant-specific metrics like spaces created, collaborators, licensed apps, and space utilization.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1oqogfr
 * @lastUpdated 2026-06-25T10:15:05.390Z
 */

import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk/db';

export interface IGovernanceAnalytics extends Document {
  tenantId: string;
  totalSpacesCreated: number;
  activeCollaboratorsCount: number;
  licensedApps: {
    appId: string;
    status: 'active' | 'suspended' | 'expired';
    expirationDate?: Date;
  }[];
  spaceUtilization: {
    spaceId: string;
    spaceName: string;
    totalAssetsCount: number; // Documentos, corpus vinculados
    storageBytesUsed: number;
  }[];
}

const GovernanceAnalyticsSchema = new Schema<IGovernanceAnalytics>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    totalSpacesCreated: { type: Number, default: 0 },
    activeCollaboratorsCount: { type: Number, default: 0 },
    licensedApps: [
      {
        appId: { type: String, required: true },
        status: { type: String, enum: ['active', 'suspended', 'expired'], required: true },
        expirationDate: { type: Date }
      }
    ],
    spaceUtilization: [
      {
        spaceId: { type: String, required: true },
        spaceName: { type: String, required: true },
        totalAssetsCount: { type: Number, required: true },
        storageBytesUsed: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export default getTenantModel<IGovernanceAnalytics>('GovernanceAnalytics', GovernanceAnalyticsSchema);
