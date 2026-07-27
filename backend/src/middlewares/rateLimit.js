import rateLimit from "express-rate-limit";

const common = {
  standardHeaders: true, // expone RateLimit-* según el estándar
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones. Intentá de nuevo en unos minutos." },
};

// Límite general del scope privado.
export const apiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

// El alta de incidentes dispara llamadas a la API de IA, que se facturan por uso:
// conviene un límite bastante más estricto que el del resto de la API.
export const createIncidentLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { error: "Alcanzaste el límite de reportes por hora. Intentá más tarde." },
});

// El scope público es anónimo (solo se valida una API key estática), por lo que
// se acota para evitar que un consumidor externo sature el servicio.
export const publicApiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 100,
});
