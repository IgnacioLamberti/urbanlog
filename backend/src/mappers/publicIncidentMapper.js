// DTO sin PII para el scope público (ej. PowerBI): sin datos del reportante.
export const toPublicIncident = (incident) => ({
  id: incident._id,
  title: incident.title,
  category: incident.category,
  priority: incident.priority,
  status: incident.status,
  address: incident.location?.address,
  coordinates: incident.location?.coordinates?.coordinates || null,
  createdAt: incident.createdAt,
  updatedAt: incident.updatedAt,
});

export const toPublicIncidentList = (incidents) => incidents.map(toPublicIncident);
