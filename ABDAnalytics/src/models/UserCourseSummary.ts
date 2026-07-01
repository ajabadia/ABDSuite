/**
 * @purpose Gestiona un esquema de mongoose para administrar datos de resumen de cursos de los usuarios.
 * @purpose_en Defines a Mongoose schema for managing user course summary data.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:d8c8pa
 * @lastUpdated 2026-06-25T10:15:11.526Z
 */

import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk/db';

export interface IUserCourseSummary extends Document {
  tenantId: string;
  userId: string;
  courseId: mongoose.Types.ObjectId;
  courseName: string;
  completedAssignments: number;
  totalAssignments: number;
  averageGrade: number; // Porcentaje de 0 a 100
  timeSpentSeconds: number; // Tiempo total invertido en exámenes del curso
  lastAttemptAt?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  weakModules: string[]; // Módulos/Tags identificados para refuerzo
}

const UserCourseSummarySchema = new Schema<IUserCourseSummary>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseName: { type: String, required: true },
    completedAssignments: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started', index: true },
    weakModules: [String]
  },
  { timestamps: true }
);

// Índice compuesto para listados rápidos de alumnos por curso
UserCourseSummarySchema.index({ tenantId: 1, courseId: 1, averageGrade: -1 });

export default getTenantModel<IUserCourseSummary>('UserCourseSummary', UserCourseSummarySchema);
