const MS_POR_HORA = 1000 * 60 * 60;

const horasEntre = (desde, hasta) =>
  desde && hasta ? Number(((new Date(hasta) - new Date(desde)) / MS_POR_HORA).toFixed(2)) : null;

// DTO sin PII para el scope público (ej. Power BI): sin datos del reportante.
// Incluye las métricas derivadas que una herramienta de análisis no podría
// calcular por su cuenta (conteo de reportes y tiempos de atención).
export const toPublicIncident = (incident, duplicadosPorIncidente = new Map()) => {
  const duplicados = duplicadosPorIncidente.get(String(incident._id)) || 0;

  return {
    id: incident._id,
    title: incident.title,
    category: incident.category,
    priority: incident.priority,
    status: incident.status,
    address: incident.location?.address,
    latitude: incident.location?.coordinates?.coordinates?.[1] ?? null,
    longitude: incident.location?.coordinates?.coordinates?.[0] ?? null,
    coordinates: incident.location?.coordinates?.coordinates || null,

    // Análisis de duplicados: cuántas veces se reportó el mismo problema.
    duplicateOfId: incident.possibleDuplicateOf || null,
    isDuplicate: Boolean(incident.possibleDuplicateOf),
    reportCount: 1 + duplicados,

    // Tiempos del ciclo de vida, en horas.
    createdAt: incident.createdAt,
    inProgressAt: incident.inProgressAt || null,
    resolvedAt: incident.resolvedAt || null,
    hoursToFirstResponse: horasEntre(incident.createdAt, incident.inProgressAt),
    hoursToResolution: horasEntre(incident.createdAt, incident.resolvedAt),
    isResolved: incident.status === "resolved",

    hasImages: (incident.images?.length || 0) > 0,
    updatedAt: incident.updatedAt,
  };
};

export const toPublicIncidentList = (incidents, duplicadosPorIncidente) =>
  incidents.map((i) => toPublicIncident(i, duplicadosPorIncidente));

// Cada cambio de estado como una fila: alimenta una tabla de hechos que permite
// analizar la evolución del trabajo a lo largo del tiempo.
export const toPublicStatusChanges = (incidents) =>
  incidents.flatMap((incident) =>
    (incident.statusHistory || []).map((cambio, indice) => ({
      incidentId: incident._id,
      sequence: indice + 1,
      fromStatus: cambio.from,
      toStatus: cambio.to,
      changedAt: cambio.changedAt,
      category: incident.category,
      priority: incident.priority,
      hoursSinceCreated: horasEntre(incident.createdAt, cambio.changedAt),
    }))
  );
