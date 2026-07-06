import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk/db';

export type TFileEvent = Document & {
  eventId: string;
  tenantId: string;
  fileId: string;
  action: 'UPLOAD' | 'DOWNLOAD' | 'OVERWRITE' | 'DELETE';
  userId: string;
  fileHash: string;
  fileSize: number;
  ipAddress?: string;
  createdAt: Date;
};

const FileEventSchema = new Schema<TFileEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true },
    fileId: { type: String, required: true },
    action: {
      type: String,
      required: true,
      enum: ['UPLOAD', 'DOWNLOAD', 'OVERWRITE', 'DELETE'],
    },
    userId: { type: String, required: true },
    fileHash: { type: String, required: true },
    fileSize: { type: Number, required: true },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

FileEventSchema.index({ tenantId: 1, fileId: 1, createdAt: -1 });

export default getTenantModel<TFileEvent>('FileEvent', FileEventSchema);
