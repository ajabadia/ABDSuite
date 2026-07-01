/**
 * @purpose Gestiona el esquema y modelo para datos de análisis de cursos en una base de datos MongoDB, incluyendo detalles específicos para los inquilinos, estadísticas de inscripción de estudiantes, tasas de completitud, calificaciones, curvas de aprendizaje y telemetry de distractor.
 * @purpose_en Manages the schema and model for course analytics data in a MongoDB database, including tenant-specific details, student enrollment statistics, completion rates, grades, learning curves, and distractor telemetry.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:zgh6ou
 * @lastUpdated 2026-06-25T10:14:53.403Z
 */

import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk/db';

export interface ICourseAnalytics extends Document {
  tenantId: string;
  courseId: mongoose.Types.ObjectId;
  totalStudentsEnrolled: number;
  completionRate: number; // Porcentaje de alumnos que completaron el itinerario
  averageGrade: number; // Nota media global del curso
  gradeDistribution: {
    fail: number;      // < 50%
    pass: number;      // 50-70%
    remarkable: number;// 70-90%
    outstanding: number;// > 90%
  };
  learningCurve: {
    date: string; // Formato YYYY-MM-DD
    averageGrade: number;
  }[];
  distractorTelemetry: {
    questionId: string;
    questionText: string;
    totalAttempts: number;
    incorrectRate: number;
    optionsFrequency: {
      optionIndex: number;
      frequency: number; // Porcentaje de selección
    }[];
  }[];
}

const CourseAnalyticsSchema = new Schema<ICourseAnalytics>(
  {
    tenantId: { type: String, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, required: true, unique: true },
    totalStudentsEnrolled: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 },
    gradeDistribution: {
      fail: { type: Number, default: 0 },
      pass: { type: Number, default: 0 },
      remarkable: { type: Number, default: 0 },
      outstanding: { type: Number, default: 0 }
    },
    learningCurve: [
      {
        date: { type: String, required: true },
        averageGrade: { type: Number, required: true }
      }
    ],
    distractorTelemetry: [
      {
        questionId: { type: String, required: true },
        questionText: { type: String, required: true },
        totalAttempts: { type: Number, required: true },
        incorrectRate: { type: Number, required: true },
        optionsFrequency: [
          {
            optionIndex: { type: Number, required: true },
            frequency: { type: Number, required: true }
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

export default getTenantModel<ICourseAnalytics>('CourseAnalytics', CourseAnalyticsSchema);
