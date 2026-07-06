import { Schema, models, model } from 'mongoose';

export type TenantRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ITenantRequest {
  _id?: string;
  organizationName: string;
  dbPrefix: string;
  contactEmail: string;
  contactName: string;
  status: TenantRequestStatus;
  ipAddress?: string;
  createdAt: Date;
}

const TenantRequestSchema = new Schema<ITenantRequest>({
  organizationName: { type: String, required: true },
  dbPrefix: { type: String, required: true, unique: true },
  contactEmail: { type: String, required: true },
  contactName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
});

TenantRequestSchema.index({ dbPrefix: 1, status: 1 });
TenantRequestSchema.index({ status: 1, createdAt: -1 });

export const TenantRequest =
  models.TenantRequest || model<ITenantRequest>('TenantRequest', TenantRequestSchema);
