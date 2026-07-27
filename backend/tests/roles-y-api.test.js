// Pruebas de autorización por rol, del circuito de moderación, de la paginación
// y del scope público de la API.
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { crearUsuario, crearIncidente, iniciarSesion, cerrarSesion } from "./helpers.js";

const { app } = await import("../src/app.js");
const { MAX_LIMIT } = await import("../src/services/incidentService.js");

const API_KEY = "clave-publica-de-prueba";

describe("Autorización por rol", () => {
  let ciudadano, moderador, operador, admin, aprobado;

  beforeEach(async () => {
    ciudadano = await crearUsuario("citizen");
    moderador = await crearUsuario("moderator");
    operador = await crearUsuario("operator");
    admin = await crearUsuario("admin");
    aprobado = await crearIncidente(ciudadano, { moderationStatus: "approved" });
  });

  it("impide a un ciudadano cambiar el estado de un incidente", async () => {
    iniciarSesion(ciudadano);

    const res = await request(app)
      .patch(`/api/v1/incidents/${aprobado._id}/status`)
      .send({ status: "in_progress" });

    expect(res.status).toBe(403);
  });

  it("permite a un operador cambiar el estado de un incidente aprobado", async () => {
    iniciarSesion(operador);

    const res = await request(app)
      .patch(`/api/v1/incidents/${aprobado._id}/status`)
      .send({ status: "in_progress" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("in_progress");
  });

  it("impide gestionar el estado de un incidente que aún no fue aprobado", async () => {
    const pendiente = await crearIncidente(ciudadano, { moderationStatus: "pending" });
    iniciarSesion(operador);

    const res = await request(app)
      .patch(`/api/v1/incidents/${pendiente._id}/status`)
      .send({ status: "in_progress" });

    expect(res.status).toBe(409);
  });

  it("rechaza un estado que no pertenece al conjunto admitido", async () => {
    iniciarSesion(operador);

    const res = await request(app)
      .patch(`/api/v1/incidents/${aprobado._id}/status`)
      .send({ status: "archivado" });

    expect(res.status).toBe(400);
  });

  it("impide a un operador moderar reportes", async () => {
    const pendiente = await crearIncidente(ciudadano, { moderationStatus: "pending" });
    iniciarSesion(operador);

    const res = await request(app)
      .patch(`/api/v1/incidents/${pendiente._id}/moderation`)
      .send({ status: "approved" });

    expect(res.status).toBe(403);
  });

  it("impide a un ciudadano listar los usuarios del sistema", async () => {
    iniciarSesion(ciudadano);

    const res = await request(app).get("/api/v1/users");

    expect(res.status).toBe(403);
  });

  it("permite al administrador listar usuarios y cambiar roles", async () => {
    iniciarSesion(admin);

    const listado = await request(app).get("/api/v1/users");
    expect(listado.status).toBe(200);

    const cambio = await request(app)
      .patch(`/api/v1/users/${ciudadano._id}/role`)
      .send({ role: "moderator" });

    expect(cambio.status).toBe(200);
    expect(cambio.body.data.role).toBe("moderator");
  });

  it("rechaza la asignación de un rol inexistente", async () => {
    iniciarSesion(admin);

    const res = await request(app)
      .patch(`/api/v1/users/${ciudadano._id}/role`)
      .send({ role: "superusuario" });

    expect(res.status).toBe(400);
  });

  it("restringe los insights de IA al administrador", async () => {
    iniciarSesion(moderador);
    expect((await request(app).get("/api/v1/insights")).status).toBe(403);

    iniciarSesion(admin);
    expect((await request(app).get("/api/v1/insights")).status).toBe(200);
  });
});

describe("Circuito de moderación", () => {
  let ciudadano, moderador;

  beforeEach(async () => {
    ciudadano = await crearUsuario("citizen");
    moderador = await crearUsuario("moderator");
  });

  it("mantiene los incidentes pendientes fuera del listado público", async () => {
    await crearIncidente(ciudadano, { moderationStatus: "pending" });
    iniciarSesion(ciudadano);

    const res = await request(app).get("/api/v1/incidents");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("publica el incidente una vez aprobado y registra al responsable", async () => {
    const pendiente = await crearIncidente(ciudadano, { moderationStatus: "pending" });
    iniciarSesion(moderador);

    const aprobacion = await request(app)
      .patch(`/api/v1/incidents/${pendiente._id}/moderation`)
      .send({ status: "approved" });

    expect(aprobacion.status).toBe(200);
    expect(aprobacion.body.data.moderation.status).toBe("approved");
    expect(String(aprobacion.body.data.moderation.moderatedBy)).toBe(String(moderador._id));

    iniciarSesion(ciudadano);
    const listado = await request(app).get("/api/v1/incidents");
    expect(listado.body.data).toHaveLength(1);
  });

  it("conserva el motivo al rechazar un reporte", async () => {
    const pendiente = await crearIncidente(ciudadano, { moderationStatus: "pending" });
    iniciarSesion(moderador);

    const res = await request(app)
      .patch(`/api/v1/incidents/${pendiente._id}/moderation`)
      .send({ status: "rejected", rejectionReason: "El reporte no corresponde a la ciudad" });

    expect(res.status).toBe(200);
    expect(res.body.data.moderation.rejectionReason).toBe("El reporte no corresponde a la ciudad");
  });

  it("permite al autor ver sus propios reportes pendientes con mine=true", async () => {
    await crearIncidente(ciudadano, { moderationStatus: "pending" });
    iniciarSesion(ciudadano);

    const res = await request(app).get("/api/v1/incidents?mine=true");

    expect(res.body.data).toHaveLength(1);
  });

  it("ignora el filtro por estado de moderación cuando lo envía un ciudadano", async () => {
    await crearIncidente(ciudadano, { moderationStatus: "pending" });
    iniciarSesion(ciudadano);

    const res = await request(app).get("/api/v1/incidents?moderationStatus=pending");

    // El controlador descarta el parámetro para los roles sin permiso de moderación.
    expect(res.body.data).toHaveLength(0);
  });
});

describe("Paginación y búsqueda", () => {
  let ciudadano;

  beforeEach(async () => {
    ciudadano = await crearUsuario("citizen");
    for (let i = 0; i < 25; i++) {
      await crearIncidente(ciudadano, {
        moderationStatus: "approved",
        title: `Incidente número ${i}`,
        address: i < 5 ? "Calle Rivadavia 100" : "Av. San Martín 450",
      });
    }
    iniciarSesion(ciudadano);
  });

  it("devuelve la primera página con el tamaño por defecto y los metadatos", async () => {
    const res = await request(app).get("/api/v1/incidents");

    expect(res.body.data).toHaveLength(20);
    expect(res.body.meta).toMatchObject({ total: 25, page: 1, limit: 20, pages: 2 });
  });

  it("devuelve la segunda página con los elementos restantes", async () => {
    const res = await request(app).get("/api/v1/incidents?page=2");

    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta.page).toBe(2);
  });

  it("acota un límite excesivo al máximo permitido", async () => {
    const res = await request(app).get("/api/v1/incidents?limit=99999");

    expect(res.body.meta.limit).toBe(MAX_LIMIT);
  });

  it("corrige los parámetros de paginación inválidos", async () => {
    const res = await request(app).get("/api/v1/incidents?page=-3&limit=abc");

    expect(res.body.meta).toMatchObject({ page: 1, limit: 20 });
  });

  it("filtra por dirección mediante el parámetro de búsqueda", async () => {
    const res = await request(app).get("/api/v1/incidents?search=Rivadavia");

    expect(res.body.meta.total).toBe(5);
  });

  it("trata la búsqueda como texto literal y no como expresión regular", async () => {
    const res = await request(app).get("/api/v1/incidents?search=.*");

    expect(res.body.meta.total).toBe(0);
  });
});

describe("Scope público de la API", () => {
  beforeEach(async () => {
    const ciudadano = await crearUsuario("citizen");
    await crearIncidente(ciudadano, { moderationStatus: "approved" });
    await crearIncidente(ciudadano, { moderationStatus: "pending" });
    cerrarSesion();
  });

  it("rechaza la petición sin clave de API", async () => {
    const res = await request(app).get("/api/public/v1/incidents");

    expect(res.status).toBe(401);
  });

  it("rechaza una clave de API incorrecta", async () => {
    const res = await request(app)
      .get("/api/public/v1/incidents")
      .set("x-api-key", "clave-invalida");

    expect(res.status).toBe(401);
  });

  it("devuelve solo incidentes aprobados y sin datos personales", async () => {
    const res = await request(app).get("/api/public/v1/incidents").set("x-api-key", API_KEY);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);

    const incidente = res.body.data[0];
    expect(incidente).toHaveProperty("category");
    expect(incidente).not.toHaveProperty("reportedBy");
    expect(incidente).not.toHaveProperty("moderation");
    expect(JSON.stringify(res.body)).not.toContain("@test.com");
  });

  it("expone las estadísticas agregadas contando solo los incidentes aprobados", async () => {
    const res = await request(app).get("/api/public/v1/stats").set("x-api-key", API_KEY);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
  });

  it("no permite escribir a través del scope público", async () => {
    const res = await request(app)
      .post("/api/public/v1/incidents")
      .set("x-api-key", API_KEY)
      .send({ title: "Intento de alta", description: "No debería crearse nunca" });

    expect(res.status).toBe(404);
  });
});

describe("Verificación de estado del servicio", () => {
  it("responde en el endpoint de salud sin autenticación", async () => {
    cerrarSesion();

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
