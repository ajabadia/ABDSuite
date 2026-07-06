import { Schema, Document, models, model } from 'mongoose';

export interface IGdprRequest extends Document {
  tenantId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedSatellites: string[];
  errorDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GdprRequestSchema = new Schema<IGdprRequest>({
  tenantId: { type: String, required: true },
  userId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  processedSatellites: { type: [String], default: [] },
  errorDetails: String,
}, { timestamps: true });

GdprRequestSchema.index({ tenantId: 1, createdAt: -1 });
GdprRequestSchema.index({ status: 1 });

export const GdprRequest =
  models.GdprRequest || model<IGdprRequest>('GdprRequest', GdprRequestSchema);
