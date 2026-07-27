import { Incident } from "../models/Incident.js";
import { compareDuplicates } from "./aiService.js";
import { nearQuery } from "../utils/geo.js";

const RADIUS_METERS = 150;
const WINDOW_DAYS = 14;

// Filtro barato (geoespacial + tiempo) en Mongo; solo si hay candidatos se
// gasta una llamada a Claude para la comparación semántica.
export async function findPossibleDuplicate(newIncident) {
  const coords = newIncident.location?.coordinates?.coordinates;
  if (!coords || coords.length !== 2) return null;

  const [lng, lat] = coords;
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await Incident.find({
    ...nearQuery(lat, lng, RADIUS_METERS),
    createdAt: { $gte: since },
    "moderation.status": { $ne: "rejected" },
  }).limit(5);

  if (candidates.length === 0) return null;

  return compareDuplicates(newIncident, candidates);
}
