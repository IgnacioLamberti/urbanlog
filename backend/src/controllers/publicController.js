import { Incident, CATEGORIES, PRIORITIES, STATUSES } from "../models/Incident.js";
import * as incidentService from "../services/incidentService.js";
import {
  toPublicIncidentList,
  toPublicStatusChanges,
} from "../mappers/publicIncidentMapper.js";
import { toPublicStats } from "../mappers/publicStatsMapper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/apiResponse.js";

// Scope público (solo lectura, pensado para Power BI u otras herramientas externas)
export const listPublicIncidents = asyncHandler(async (req, res) => {
  const { status, category, priority, search, page, limit } = req.query;

  const result = await incidentService.listIncidents({
    status,
    category,
    priority,
    search,
    moderationStatus: "approved",
    page,
    limit,
    maxLimit: incidentService.MAX_ANALYTICS_LIMIT,
  });

  const duplicados = await incidentService.countReportsByIncident(result.items.map((i) => i._id));

  ok(res, toPublicIncidentList(result.items, duplicados), {
    total: result.total,
    page: result.page,
    limit: result.limit,
    pages: result.pages,
  });
});

export const getPublicStats = asyncHandler(async (req, res) => {
  const stats = await incidentService.getStats();
  ok(res, toPublicStats(stats));
});

// Tabla de hechos con cada transición de estado registrada.
export const listPublicStatusChanges = asyncHandler(async (req, res) => {
  const incidents = await Incident.find({
    "moderation.status": "approved",
    "statusHistory.0": { $exists: true },
  })
    .select("statusHistory category priority createdAt")
    .limit(incidentService.MAX_ANALYTICS_LIMIT);

  const cambios = toPublicStatusChanges(incidents);
  ok(res, cambios, { total: cambios.length });
});

// Catálogos del dominio: alimentan las tablas de dimensión del modelo.
export const getPublicCatalogs = asyncHandler(async (req, res) => {
  const etiquetasCategoria = {
    infraestructura_vial: "Infraestructura Vial",
    iluminacion: "Iluminación",
    residuos: "Residuos",
    espacios_verdes: "Espacios Verdes",
    agua_cloacas: "Agua y Cloacas",
    seguridad: "Seguridad",
    otro: "Otro",
  };
  const ordenPrioridad = { baja: 1, media: 2, alta: 3, critica: 4 };
  const etiquetasEstado = { open: "Abierto", in_progress: "En Proceso", resolved: "Resuelto" };

  ok(res, {
    categories: CATEGORIES.map((c) => ({ key: c, label: etiquetasCategoria[c] || c })),
    priorities: PRIORITIES.map((p) => ({
      key: p,
      label: p.charAt(0).toUpperCase() + p.slice(1),
      level: ordenPrioridad[p],
    })),
    statuses: STATUSES.map((s, i) => ({ key: s, label: etiquetasEstado[s], order: i + 1 })),
  });
});
