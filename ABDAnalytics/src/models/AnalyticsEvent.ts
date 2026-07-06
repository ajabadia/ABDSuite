import mongoose, { Schema, Document } from 'mongoose';
import { connectDB } from '@ajabadia/satellite-sdk/db';

export type TAnalyticsEvent = Document & {
  eventId: string;
  eventType: string;
  metadata: Record<string, unknown>;
  clientIp?: string;
  tenantId?: string;
  createdAt: Date;
};

const AnalyticsEventSchema = new Schema<TAnalyticsEvent>({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  clientIp: { type: String },
  tenantId: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.AnalyticsEvent ||
  mongoose.model<TAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
