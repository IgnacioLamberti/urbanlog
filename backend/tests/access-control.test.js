// Pruebas de control de acceso. Cubren la regla de visibilidad de incidentes:
// los aprobados son visibles para cualquier usuario autenticado, mientras que
// los pendientes y rechazados solo lo son para su autor y el personal municipal.
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { crearUsuario, crearIncidente, iniciarSesion, cerrarSesion } from "./helpers.js";

// La aplicación se carga después de helpers.js para que los dobles ya estén registrados.
const { app } = await import("../src/app.js");

describe("Visibilidad del detalle de un incidente", () => {
  let autor, otroCiudadano, incidentePendiente;

  beforeEach(async () => {
    autor = await crearUsuario("citizen");
    otroCiudadano = await crearUsuario("citizen");
    incidentePendiente = await crearIncidente(autor, { moderationStatus: "pending" });
  });

  it("permite a cualquier autenticado ver un incidente aprobado", async () => {
    const aprobado = await crearIncidente(autor, { moderationStatus: "approved" });
    iniciarSesion(otroCiudadano);

    const res = await request(app).get(`/api/v1/incidents/${aprobado._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Bache en la esquina");
  });

  it("oculta a un ciudadano ajeno los incidentes pendientes de moderación", async () => {
    iniciarSesion(otroCiudadano);

    const res = await request(app).get(`/api/v1/incidents/${incidentePendiente._id}`);

    // Se responde 404 en lugar de 403 para no revelar que el recurso existe.
    expect(res.status).toBe(404);
  });

  it("no expone el motivo de rechazo ni los datos del reportante a un tercero", async () => {
    const rechazado = await crearIncidente(autor, { moderationStatus: "rejected" });
    iniciarSesion(otroCiudadano);

    const res = await request(app).get(`/api/v1/incidents/${rechazado._id}`);

    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain(autor.email);
  });

  it("permite al autor ver su propio incidente pendiente", async () => {
    iniciarSesion(autor);

    const res = await request(app).get(`/api/v1/incidents/${incidentePendiente._id}`);

    expect(res.status).toBe(200);
  });

  it("permite a un moderador ver incidentes pendientes ajenos", async () => {
    const moderador = await crearUsuario("moderator");
    iniciarSesion(moderador);

    const res = await request(app).get(`/api/v1/incidents/${incidentePendiente._id}`);

    expect(res.status).toBe(200);
  });

  it("rechaza la petición sin sesión iniciada", async () => {
    cerrarSesion();

    const res = await request(app).get(`/api/v1/incidents/${incidentePendiente._id}`);

    expect(res.status).toBe(401);
  });
});

describe("Visibilidad de los comentarios", () => {
  let autor, otroCiudadano, pendiente;

  beforeEach(async () => {
    autor = await crearUsuario("citizen");
    otroCiudadano = await crearUsuario("citizen");
    pendiente = await crearIncidente(autor, { moderationStatus: "pending" });
  });

  it("impide leer los comentarios de un incidente que no se puede ver", async () => {
    iniciarSesion(otroCiudadano);

    const res = await request(app).get(`/api/v1/incidents/${pendiente._id}/comments`);

    expect(res.status).toBe(404);
  });

  it("impide comentar en un incidente que no se puede ver", async () => {
    iniciarSesion(otroCiudadano);

    const res = await request(app)
      .post(`/api/v1/incidents/${pendiente._id}/comments`)
      .send({ text: "Comentario indebido" });

    expect(res.status).toBe(404);
  });

  it("no crea comentarios huérfanos sobre incidentes inexistentes", async () => {
    iniciarSesion(otroCiudadano);

    const res = await request(app)
      .post("/api/v1/incidents/6a4558583c5e5b467437adec/comments")
      .send({ text: "Comentario sobre la nada" });

    expect(res.status).toBe(404);
  });

  it("permite comentar un incidente aprobado", async () => {
    const aprobado = await crearIncidente(autor, { moderationStatus: "approved" });
    iniciarSesion(otroCiudadano);

    const res = await request(app)
      .post(`/api/v1/incidents/${aprobado._id}/comments`)
      .send({ text: "Confirmo que el problema sigue" });

    expect(res.status).toBe(201);
    expect(res.body.data.text).toBe("Confirmo que el problema sigue");
  });

  it("rechaza un comentario vacío", async () => {
    const aprobado = await crearIncidente(autor, { moderationStatus: "approved" });
    iniciarSesion(otroCiudadano);

    const res = await request(app)
      .post(`/api/v1/incidents/${aprobado._id}/comments`)
      .send({ text: "   " });

    expect(res.status).toBe(400);
  });
});
