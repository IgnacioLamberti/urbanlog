// Pruebas del scope público orientado a análisis: conteo de reportes por
// incidente, historial de cambios de estado y catálogos del dominio.
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { crearUsuario, crearIncidente, iniciarSesion, cerrarSesion } from "./helpers.js";

const { app } = await import("../src/app.js");
const { Incident } = await import("../src/models/Incident.js");

const API_KEY = "clave-publica-de-prueba";
const conClave = (ruta) => request(app).get(ruta).set("x-api-key", API_KEY);

describe("Conteo de reportes por incidente", () => {
  let ciudadano;

  beforeEach(async () => {
    ciudadano = await crearUsuario("citizen");
    cerrarSesion();
  });

  it("cuenta un solo reporte cuando el incidente no tiene duplicados", async () => {
    await crearIncidente(ciudadano, { moderationStatus: "approved" });

    const res = await conClave("/api/public/v1/incidents");

    expect(res.status).toBe(200);
    expect(res.body.data[0].reportCount).toBe(1);
    expect(res.body.data[0].isDuplicate).toBe(false);
  });

  it("suma los duplicados al conteo del incidente original", async () => {
    const original = await crearIncidente(ciudadano, { moderationStatus: "approved" });

    for (let i = 0; i < 3; i++) {
      const dup = await crearIncidente(ciudadano, { moderationStatus: "approved" });
      await Incident.findByIdAndUpdate(dup._id, { possibleDuplicateOf: original._id });
    }

    const res = await conClave("/api/public/v1/incidents?limit=100");
    const encontrado = res.body.data.find((i) => i.id === String(original._id));

    // El original más sus tres duplicados.
    expect(encontrado.reportCount).toBe(4);
  });

  it("marca los duplicados y los vincula con su original", async () => {
    const original = await crearIncidente(ciudadano, { moderationStatus: "approved" });
    const dup = await crearIncidente(ciudadano, { moderationStatus: "approved" });
    await Incident.findByIdAndUpdate(dup._id, { possibleDuplicateOf: original._id });

    const res = await conClave("/api/public/v1/incidents?limit=100");
    const duplicado = res.body.data.find((i) => i.id === String(dup._id));

    expect(duplicado.isDuplicate).toBe(true);
    expect(String(duplicado.duplicateOfId)).toBe(String(original._id));
  });

  it("expone latitud y longitud por separado para el mapa", async () => {
    await crearIncidente(ciudadano, { moderationStatus: "approved" });

    const res = await conClave("/api/public/v1/incidents");

    expect(res.body.data[0].latitude).toBeCloseTo(-32.4076, 3);
    expect(res.body.data[0].longitude).toBeCloseTo(-63.2304, 3);
  });

  it("sigue sin exponer datos personales del reportante", async () => {
    await crearIncidente(ciudadano, { moderationStatus: "approved" });

    const res = await conClave("/api/public/v1/incidents");

    expect(res.body.data[0]).not.toHaveProperty("reportedBy");
    expect(JSON.stringify(res.body)).not.toContain("@test.com");
  });
});

describe("Tiempos del ciclo de vida", () => {
  let ciudadano, operador, incidente;

  beforeEach(async () => {
    ciudadano = await crearUsuario("citizen");
    operador = await crearUsuario("operator");
    incidente = await crearIncidente(ciudadano, { moderationStatus: "approved" });
  });

  it("registra el historial al cambiar de estado", async () => {
    iniciarSesion(operador);

    await request(app)
      .patch(`/api/v1/incidents/${incidente._id}/status`)
      .send({ status: "in_progress" });
    await request(app)
      .patch(`/api/v1/incidents/${incidente._id}/status`)
      .send({ status: "resolved" });

    const guardado = await Incident.findById(incidente._id);

    expect(guardado.statusHistory).toHaveLength(2);
    expect(guardado.statusHistory[0]).toMatchObject({ from: "open", to: "in_progress" });
    expect(guardado.statusHistory[1]).toMatchObject({ from: "in_progress", to: "resolved" });
    expect(guardado.inProgressAt).toBeTruthy();
    expect(guardado.resolvedAt).toBeTruthy();
  });

  it("calcula las horas hasta la atención y hasta la resolución", async () => {
    iniciarSesion(operador);
    await request(app)
      .patch(`/api/v1/incidents/${incidente._id}/status`)
      .send({ status: "resolved" });

    cerrarSesion();
    const res = await conClave("/api/public/v1/incidents");
    const publicado = res.body.data[0];

    expect(publicado.isResolved).toBe(true);
    expect(publicado.hoursToResolution).toBeGreaterThanOrEqual(0);
  });

  it("limpia la marca de resolución si el incidente se reabre", async () => {
    iniciarSesion(operador);
    await request(app).patch(`/api/v1/incidents/${incidente._id}/status`).send({ status: "resolved" });
    await request(app).patch(`/api/v1/incidents/${incidente._id}/status`).send({ status: "open" });

    const guardado = await Incident.findById(incidente._id);

    expect(guardado.resolvedAt).toBeNull();
    expect(guardado.status).toBe("open");
  });

  it("deja los tiempos en nulo mientras el incidente sigue abierto", async () => {
    cerrarSesion();
    const res = await conClave("/api/public/v1/incidents");

    expect(res.body.data[0].hoursToResolution).toBeNull();
    expect(res.body.data[0].hoursToFirstResponse).toBeNull();
  });
});

describe("Endpoint de cambios de estado", () => {
  it("exige la clave de API", async () => {
    cerrarSesion();
    const res = await request(app).get("/api/public/v1/status-changes");
    expect(res.status).toBe(401);
  });

  it("devuelve una fila por cada transición registrada", async () => {
    const ciudadano = await crearUsuario("citizen");
    const operador = await crearUsuario("operator");
    const incidente = await crearIncidente(ciudadano, { moderationStatus: "approved" });

    iniciarSesion(operador);
    await request(app).patch(`/api/v1/incidents/${incidente._id}/status`).send({ status: "in_progress" });
    await request(app).patch(`/api/v1/incidents/${incidente._id}/status`).send({ status: "resolved" });

    cerrarSesion();
    const res = await conClave("/api/public/v1/status-changes");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({ sequence: 1, fromStatus: "open", toStatus: "in_progress" });
    expect(res.body.data[1]).toMatchObject({ sequence: 2, toStatus: "resolved" });
    expect(res.body.data[0].category).toBe("infraestructura_vial");
  });
});

describe("Endpoint de catálogos", () => {
  it("exige la clave de API", async () => {
    cerrarSesion();
    expect((await request(app).get("/api/public/v1/catalogs")).status).toBe(401);
  });

  it("devuelve las dimensiones del dominio con sus etiquetas", async () => {
    cerrarSesion();
    const res = await conClave("/api/public/v1/catalogs");

    expect(res.status).toBe(200);
    expect(res.body.data.categories).toHaveLength(7);
    expect(res.body.data.priorities).toHaveLength(4);
    expect(res.body.data.statuses).toHaveLength(3);

    // El nivel numérico permite ordenar la prioridad en la herramienta de BI.
    const critica = res.body.data.priorities.find((p) => p.key === "critica");
    expect(critica.level).toBe(4);
  });
});
