// Dobles de prueba y fábricas de datos.
//
// Las llamadas a vi.mock deben estar en el nivel superior del módulo: vitest las
// eleva y las ejecuta antes que cualquier importación. Por eso los archivos de
// prueba deben importar este módulo ANTES de cargar la aplicación.
import { vi } from "vitest";
import { User } from "../src/models/User.js";
import { Incident } from "../src/models/Incident.js";
import { session } from "./session.js";

vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  requireAuth: () => (req, res, next) => next(),
  getAuth: () => ({ userId: "user_test" }),
  createClerkClient: () => ({ users: { getUser: async () => ({}) } }),
}));

vi.mock("../src/middlewares/clerkAuth.js", async () => {
  const { session } = await import("./session.js");
  return {
    clerkAuth: (req, res, next) =>
      session.user ? next() : res.status(401).json({ error: "Token requerido" }),
  };
});

vi.mock("../src/middlewares/attachUser.js", async () => {
  const { session } = await import("./session.js");
  return {
    attachUser: (req, res, next) => {
      req.dbUser = session.user;
      next();
    },
  };
});

// Servicios externos: se sustituyen para que las pruebas no realicen llamadas
// de red ni consuman cuota de los proveedores.
vi.mock("../src/services/aiService.js", () => ({
  classifyAndEnrichIncident: vi.fn(async (title, description) => ({
    category: "infraestructura_vial",
    priority: "alta",
    normalizedDescription: `Normalizado: ${description}`,
    aiSummary: `Resumen: ${title}`,
  })),
  compareDuplicates: vi.fn(async () => null),
  generateCityInsights: vi.fn(async () => "Insight de prueba"),
}));

vi.mock("../src/services/imageService.js", () => ({
  uploadIncidentImages: vi.fn(async () => []),
}));

vi.mock("../src/services/emailService.js", () => ({
  sendStatusChangeEmail: vi.fn(async () => {}),
}));

let seq = 0;

export const crearUsuario = (role = "citizen") =>
  User.create({
    clerkId: `user_${role}_${++seq}`,
    email: `${role}${seq}@test.com`,
    name: `Usuario ${role}`,
    role,
  });

export const crearIncidente = (autor, overrides = {}) =>
  Incident.create({
    title: overrides.title || "Bache en la esquina",
    description: overrides.description || "Hay un pozo grande que rompe las ruedas",
    category: overrides.category || "infraestructura_vial",
    priority: overrides.priority || "alta",
    status: overrides.status || "open",
    moderation: { status: overrides.moderationStatus || "pending" },
    location: {
      address: overrides.address || "Av. San Martín 450",
      coordinates: { type: "Point", coordinates: [-63.2304, -32.4076] },
    },
    reportedBy: autor._id,
  });

export const iniciarSesion = (user) => {
  session.user = user;
};

export const cerrarSesion = () => {
  session.user = null;
};
