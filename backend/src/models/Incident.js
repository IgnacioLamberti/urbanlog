import mongoose from "mongoose";

export const CATEGORIES = [
  "infraestructura_vial",
  "iluminacion",
  "residuos",
  "espacios_verdes",
  "agua_cloacas",
  "seguridad",
  "otro",
];

export const PRIORITIES = ["baja", "media", "alta", "critica"];
export const STATUSES = ["open", "in_progress", "resolved"];
export const MODERATION_STATUSES = ["pending", "approved", "rejected"];

const incidentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    normalizedDescription: { type: String, default: "" },
    aiSummary: { type: String, default: "" },

    category: { type: String, enum: CATEGORIES, default: "otro" },
    priority: { type: String, enum: PRIORITIES, default: "media" },
    status: { type: String, enum: STATUSES, default: "open" },

    moderation: {
      status: { type: String, enum: MODERATION_STATUSES, default: "pending" },
      moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      moderatedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: "" },
    },

    location: {
      address: { type: String, default: "Sin ubicación especificada" },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: undefined }, // [lng, lat]
      },
    },

    images: { type: [String], default: [] },

    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    possibleDuplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", default: null },

    // Traza de los cambios de estado operativo. Permite medir tiempos de
    // atención y de resolución, que no pueden derivarse de updatedAt porque
    // este se modifica ante cualquier actualización del documento.
    statusHistory: {
      type: [
        {
          _id: false,
          from: { type: String, enum: [...STATUSES, null], default: null },
          to: { type: String, enum: STATUSES, required: true },
          changedAt: { type: Date, required: true },
          changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        },
      ],
      default: [],
    },

    // Marcas planas derivadas del historial, para consultas y análisis directos.
    inProgressAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

incidentSchema.index({ "location.coordinates": "2dsphere" });
incidentSchema.index({ status: 1, "moderation.status": 1 });
incidentSchema.index({ category: 1 });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ possibleDuplicateOf: 1 });

export const Incident = mongoose.model("Incident", incidentSchema);
