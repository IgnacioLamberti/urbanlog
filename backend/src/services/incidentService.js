import { Incident } from "../models/Incident.js";
import { classifyAndEnrichIncident } from "./aiService.js";
import { findPossibleDuplicate } from "./duplicateDetectionService.js";
import { uploadIncidentImages } from "./imageService.js";
import { sendStatusChangeEmail } from "./emailService.js";
import { toGeoPoint } from "../utils/geo.js";

const populateFields = [
  { path: "reportedBy", select: "name email imageUrl role" },
  { path: "assignedTo", select: "name email role" },
];

// Roles que pueden ver incidentes que todavía no fueron aprobados.
const STAFF_ROLES = ["moderator", "operator", "admin"];

// Un incidente aprobado lo ve cualquier usuario autenticado. Uno pendiente o
// rechazado solo lo ven su autor y el personal municipal: de lo contrario
// cualquiera podría leer por id contenido sin moderar, junto con los datos
// personales del reportante y el motivo del rechazo.
export function canViewIncident(incident, user) {
  if (incident.moderation?.status === "approved") return true;
  if (STAFF_ROLES.includes(user.role)) return true;

  const authorId = incident.reportedBy?._id ?? incident.reportedBy;
  return String(authorId) === String(user._id);
}

// Carga el incidente aplicando la regla de visibilidad. Devuelve 404 —y no 403—
// cuando el usuario no puede verlo, para no revelar que el recurso existe.
export async function getVisibleIncident(id, user) {
  const incident = await getIncidentById(id);
  if (!incident || !canViewIncident(incident, user)) {
    const err = new Error("Incidente no encontrado");
    err.status = 404;
    throw err;
  }
  return incident;
}

export async function createIncident({ title, description, location, files, reportedBy }) {
  const enrichment = await classifyAndEnrichIncident(title, description);
  const images = await uploadIncidentImages(files);

  const incident = new Incident({
    title,
    description,
    normalizedDescription: enrichment.normalizedDescription,
    aiSummary: enrichment.aiSummary,
    category: enrichment.category,
    priority: enrichment.priority,
    location: {
      address: location?.address || "Sin ubicación especificada",
      coordinates:
        location?.lat != null && location?.lng != null ? toGeoPoint(location.lat, location.lng) : undefined,
    },
    images,
    reportedBy,
  });

  incident.possibleDuplicateOf = await findPossibleDuplicate(incident);

  await incident.save();
  return incident.populate(populateFields);
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
// El scope público es de solo lectura y está pensado para herramientas de
// análisis, que necesitan extraer el conjunto completo en pocas peticiones.
export const MAX_ANALYTICS_LIMIT = 1000;

// Cuenta, para cada incidente, cuántos reportes lo tienen como original. El
// total de reportes de un incidente es esa cantidad más el reporte propio.
export async function countReportsByIncident(incidentIds) {
  const agrupados = await Incident.aggregate([
    { $match: { possibleDuplicateOf: { $in: incidentIds } } },
    { $group: { _id: "$possibleDuplicateOf", duplicados: { $sum: 1 } } },
  ]);

  return new Map(agrupados.map((g) => [String(g._id), g.duplicados]));
}

// Acota la paginación a valores razonables: sin un tope, un `limit` arbitrario
// desde el query permitiría volcar la colección completa en una sola petición.
function normalizePagination(page, limit, maxLimit = MAX_LIMIT) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedLimit = Number.parseInt(limit, 10);
  const safeLimit = Number.isNaN(parsedLimit)
    ? DEFAULT_LIMIT
    : Math.min(Math.max(1, parsedLimit), maxLimit);
  return { page: safePage, limit: safeLimit };
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function listIncidents({
  status,
  category,
  priority,
  moderationStatus,
  reportedBy,
  search,
  page: rawPage,
  limit: rawLimit,
  maxLimit,
}) {
  const { page, limit } = normalizePagination(rawPage, rawLimit, maxLimit);

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (reportedBy) filter.reportedBy = reportedBy;
  if (moderationStatus) filter["moderation.status"] = moderationStatus;
  else if (!reportedBy) filter["moderation.status"] = "approved";

  if (search?.trim()) {
    const term = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ title: term }, { description: term }, { "location.address": term }];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Incident.find(filter).populate(populateFields).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Incident.countDocuments(filter),
  ]);

  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export const getIncidentById = (id) => Incident.findById(id).populate(populateFields);

export async function updateIncidentStatus(id, status, changedBy = null) {
  const incident = await Incident.findById(id).populate(populateFields);
  if (!incident) {
    const err = new Error("Incidente no encontrado");
    err.status = 404;
    throw err;
  }

  // El ciclo operativo solo aplica a incidentes ya validados por un moderador.
  if (incident.moderation?.status !== "approved") {
    const err = new Error("El incidente debe estar aprobado para gestionar su estado");
    err.status = 409;
    throw err;
  }

  const previousStatus = incident.status;
  const changedAt = new Date();

  incident.statusHistory.push({ from: previousStatus, to: status, changedAt, changedBy });
  if (status === "in_progress" && !incident.inProgressAt) incident.inProgressAt = changedAt;
  if (status === "resolved") incident.resolvedAt = changedAt;
  // Si se reabre, el incidente deja de estar resuelto.
  if (status !== "resolved") incident.resolvedAt = null;

  incident.status = status;
  await incident.save();

  sendStatusChangeEmail({
    to: incident.reportedBy?.email,
    incidentTitle: incident.title,
    newStatus: status,
  });

  return incident;
}

export async function moderateIncident(id, { status, moderatorId, rejectionReason }) {
  const incident = await Incident.findById(id);
  if (!incident) {
    const err = new Error("Incidente no encontrado");
    err.status = 404;
    throw err;
  }

  incident.moderation = {
    status,
    moderatedBy: moderatorId,
    moderatedAt: new Date(),
    rejectionReason: status === "rejected" ? rejectionReason || "" : "",
  };

  await incident.save();
  return incident.populate(populateFields);
}

export async function getStats() {
  const [total, open, inProgress, resolved, critical, byCategoryAgg] = await Promise.all([
    Incident.countDocuments({ "moderation.status": "approved" }),
    Incident.countDocuments({ "moderation.status": "approved", status: "open" }),
    Incident.countDocuments({ "moderation.status": "approved", status: "in_progress" }),
    Incident.countDocuments({ "moderation.status": "approved", status: "resolved" }),
    Incident.countDocuments({ "moderation.status": "approved", priority: "critica" }),
    Incident.aggregate([
      { $match: { "moderation.status": "approved" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  const byCategory = Object.fromEntries(byCategoryAgg.map((c) => [c._id, c.count]));
  return { total, open, inProgress, resolved, critical, byCategory };
}
