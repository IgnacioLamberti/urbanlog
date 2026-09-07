// Genera un conjunto de datos de DEMOSTRACIÓN para el trabajo de Business
// Intelligence. Los datos son sintéticos: no corresponden a reportes reales.
//
// Seguridad: todo lo que crea este script queda asociado a usuarios de demo
// (correo @demo.urbanlog.local). La opción --reset borra únicamente esos datos,
// de modo que nunca puede eliminar incidentes reales cargados desde la app.
//
//   node scripts/seed-demo-data.mjs            → agrega los datos de demo
//   node scripts/seed-demo-data.mjs --reset    → borra los datos de demo y los recrea
//
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../src/models/User.js";
import { Incident } from "../src/models/Incident.js";

const DOMINIO_DEMO = "demo.urbanlog.local";
const CANTIDAD_INCIDENTES = 320;
const MESES_DE_HISTORIA = 6;

// Centro aproximado de Villa María, Córdoba.
const CENTRO = { lat: -32.4076, lng: -63.2304 };

const azar = (min, max) => Math.random() * (max - min) + min;
const entero = (min, max) => Math.floor(azar(min, max + 1));
const elegir = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Distribución ponderada: refleja que no todos los problemas se reportan igual.
const elegirPonderado = (opciones) => {
  const total = opciones.reduce((s, o) => s + o.peso, 0);
  let r = Math.random() * total;
  for (const o of opciones) {
    r -= o.peso;
    if (r <= 0) return o.valor;
  }
  return opciones[0].valor;
};

const BARRIOS = [
  { nombre: "Centro", lat: -32.4076, lng: -63.2304, peso: 25 },
  { nombre: "Barrio Belgrano", lat: -32.3985, lng: -63.2401, peso: 15 },
  { nombre: "Barrio San Nicolás", lat: -32.4162, lng: -63.2198, peso: 14 },
  { nombre: "Villa Nueva", lat: -32.4321, lng: -63.2452, peso: 12 },
  { nombre: "Barrio Las Playas", lat: -32.3902, lng: -63.2187, peso: 11 },
  { nombre: "Barrio Palermo", lat: -32.4215, lng: -63.2508, peso: 9 },
  { nombre: "Barrio Rivadavia", lat: -32.3948, lng: -63.2589, peso: 8 },
  { nombre: "Barrio Industrial", lat: -32.4398, lng: -63.2103, peso: 6 },
];

const CALLES = [
  "Av. San Martín", "Bv. España", "Entre Ríos", "Buenos Aires", "Corrientes",
  "Mendoza", "Santa Fe", "Lisandro de la Torre", "Sarmiento", "Rivadavia",
  "Belgrano", "Tucumán", "Catamarca", "Salta", "Av. Perón",
];

// Cada categoría tiene su propio perfil: cuán frecuente es, qué prioridad suele
// recibir y cuánto tarda en resolverse.
const CATEGORIAS = [
  {
    clave: "infraestructura_vial",
    peso: 28,
    prioridades: [
      { valor: "baja", peso: 15 }, { valor: "media", peso: 40 },
      { valor: "alta", peso: 35 }, { valor: "critica", peso: 10 },
    ],
    horasResolucion: [48, 480],
    titulos: [
      "Bache profundo en {calle}", "Calzada hundida sobre {calle}",
      "Pozo en la intersección de {calle}", "Asfalto levantado en {calle}",
      "Cordón roto en {calle}", "Badén destruido en {calle}",
    ],
    descripciones: [
      "Hay un pozo grande que ya provocó daños en varios vehículos.",
      "El asfalto está completamente levantado y es peligroso para las motos.",
      "Se formó un hundimiento que empeora cada vez que llueve.",
      "El bache ocupa medio carril y obliga a esquivarlo invadiendo el contrario.",
    ],
  },
  {
    clave: "iluminacion",
    peso: 20,
    prioridades: [
      { valor: "baja", peso: 25 }, { valor: "media", peso: 45 },
      { valor: "alta", peso: 27 }, { valor: "critica", peso: 3 },
    ],
    horasResolucion: [24, 240],
    titulos: [
      "Luminaria apagada en {calle}", "Poste de luz sin funcionar en {calle}",
      "Tres luminarias consecutivas apagadas en {calle}", "Luz intermitente en {calle}",
    ],
    descripciones: [
      "La cuadra quedó completamente a oscuras y es inseguro caminar de noche.",
      "Hace más de dos semanas que la luminaria no enciende.",
      "La luz prende y se apaga toda la noche, prácticamente no ilumina.",
    ],
  },
  {
    clave: "residuos",
    peso: 18,
    prioridades: [
      { valor: "baja", peso: 45 }, { valor: "media", peso: 40 },
      { valor: "alta", peso: 14 }, { valor: "critica", peso: 1 },
    ],
    horasResolucion: [12, 120],
    titulos: [
      "Basura acumulada en {calle}", "Microbasural en {calle}",
      "Contenedor desbordado en {calle}", "Restos de poda sin retirar en {calle}",
    ],
    descripciones: [
      "Hace días que no pasa el camión recolector y se acumuló mucha basura.",
      "Se formó un microbasural que genera olores y atrae roedores.",
      "El contenedor está desbordado y la basura quedó en la vereda.",
    ],
  },
  {
    clave: "agua_cloacas",
    peso: 12,
    prioridades: [
      { valor: "baja", peso: 8 }, { valor: "media", peso: 30 },
      { valor: "alta", peso: 42 }, { valor: "critica", peso: 20 },
    ],
    horasResolucion: [6, 96],
    titulos: [
      "Pérdida de agua en {calle}", "Cloaca desbordada en {calle}",
      "Caño roto sobre {calle}", "Agua servida en la calzada de {calle}",
    ],
    descripciones: [
      "Hay una pérdida constante de agua que corre por toda la cuadra.",
      "La cloaca desbordó y el olor es insoportable, hay líquido en la vereda.",
      "Se rompió un caño y el agua está socavando el pavimento.",
    ],
  },
  {
    clave: "espacios_verdes",
    peso: 10,
    prioridades: [
      { valor: "baja", peso: 40 }, { valor: "media", peso: 42 },
      { valor: "alta", peso: 16 }, { valor: "critica", peso: 2 },
    ],
    horasResolucion: [48, 360],
    titulos: [
      "Árbol caído en {calle}", "Rama a punto de caer en {calle}",
      "Pasto muy alto en la plaza de {calle}", "Juegos rotos en la plaza de {calle}",
    ],
    descripciones: [
      "El árbol cayó sobre la vereda y obstruye el paso de los peatones.",
      "Hay una rama muy grande a punto de desprenderse sobre la vereda.",
      "El pasto está altísimo y no se puede usar el espacio.",
    ],
  },
  {
    clave: "seguridad",
    peso: 8,
    prioridades: [
      { valor: "baja", peso: 10 }, { valor: "media", peso: 25 },
      { valor: "alta", peso: 40 }, { valor: "critica", peso: 25 },
    ],
    horasResolucion: [4, 72],
    titulos: [
      "Cable de electricidad colgando en {calle}", "Tapa de cámara faltante en {calle}",
      "Semáforo sin funcionar en {calle}", "Poste inclinado a punto de caer en {calle}",
    ],
    descripciones: [
      "Hay un cable suelto colgando a la altura de las personas, es muy peligroso.",
      "Falta la tapa de la cámara subterránea y el pozo quedó abierto en plena vereda.",
      "El semáforo no funciona y es un cruce con mucho tránsito.",
    ],
  },
  {
    clave: "otro",
    peso: 4,
    prioridades: [
      { valor: "baja", peso: 40 }, { valor: "media", peso: 45 },
      { valor: "alta", peso: 14 }, { valor: "critica", peso: 1 },
    ],
    horasResolucion: [24, 300],
    titulos: ["Problema sin clasificar en {calle}", "Reclamo vecinal en {calle}"],
    descripciones: ["Situación que no encuadra en las categorías existentes."],
  },
];

function coordenadaCercana(barrio, dispersion = 0.006) {
  return {
    lat: barrio.lat + azar(-dispersion, dispersion),
    lng: barrio.lng + azar(-dispersion, dispersion),
  };
}

async function limpiarDatosDemo() {
  const usuariosDemo = await User.find({ email: new RegExp(`@${DOMINIO_DEMO}$`) }).select("_id");
  const ids = usuariosDemo.map((u) => u._id);

  const incidentes = await Incident.deleteMany({ reportedBy: { $in: ids } });
  const usuarios = await User.deleteMany({ _id: { $in: ids } });

  console.log(`🧹 Borrados ${incidentes.deletedCount} incidentes y ${usuarios.deletedCount} usuarios de demo.`);
}

async function crearUsuariosDemo() {
  const perfiles = [
    ...Array.from({ length: 40 }, (_, i) => ({ role: "citizen", n: i + 1 })),
    ...Array.from({ length: 3 }, (_, i) => ({ role: "moderator", n: i + 1 })),
    ...Array.from({ length: 4 }, (_, i) => ({ role: "operator", n: i + 1 })),
  ];

  const usuarios = await User.insertMany(
    perfiles.map(({ role, n }) => ({
      clerkId: `demo_${role}_${n}_${Date.now()}`,
      email: `${role}${n}@${DOMINIO_DEMO}`,
      name: `${role === "citizen" ? "Vecino" : role === "moderator" ? "Moderador" : "Operador"} ${n}`,
      role,
    }))
  );

  return {
    ciudadanos: usuarios.filter((u) => u.role === "citizen"),
    moderadores: usuarios.filter((u) => u.role === "moderator"),
    operadores: usuarios.filter((u) => u.role === "operator"),
  };
}

function construirIncidente({ categoria, fechaCreacion, barrio, coord, autor, prioridadForzada }) {
  const calle = elegir(CALLES);
  const titulo = elegir(categoria.titulos).replace("{calle}", `${calle} ${entero(50, 3200)}`);
  const prioridad = prioridadForzada || elegirPonderado(categoria.prioridades);

  return {
    title: titulo,
    description: elegir(categoria.descripciones),
    normalizedDescription: elegir(categoria.descripciones),
    aiSummary: titulo.slice(0, 80),
    category: categoria.clave,
    priority: prioridad,
    location: {
      address: `${calle} ${entero(50, 3200)}, ${barrio.nombre}, Villa María`,
      coordinates: { type: "Point", coordinates: [coord.lng, coord.lat] },
    },
    images: Math.random() < 0.45 ? ["https://res.cloudinary.com/demo/incidente.jpg"] : [],
    reportedBy: autor._id,
    createdAt: fechaCreacion,
    updatedAt: fechaCreacion,
  };
}

// Asigna el recorrido de estados de forma coherente con la prioridad: los
// incidentes críticos se atienden antes y se resuelven en mayor proporción.
function aplicarCicloDeVida(doc, categoria, moderadores, operadores, ahora) {
  const creado = new Date(doc.createdAt);
  const moderador = elegir(moderadores);

  // El 8% de los reportes se rechaza por contenido inválido.
  if (Math.random() < 0.08) {
    doc.moderation = {
      status: "rejected",
      moderatedBy: moderador._id,
      moderatedAt: new Date(creado.getTime() + azar(1, 48) * 3600e3),
      rejectionReason: elegir([
        "El reporte no corresponde al ejido municipal.",
        "Información insuficiente para identificar el problema.",
        "Duplicado de un reporte ya gestionado.",
      ]),
    };
    return;
  }

  doc.moderation = {
    status: "approved",
    moderatedBy: moderador._id,
    moderatedAt: new Date(creado.getTime() + azar(0.5, 36) * 3600e3),
    rejectionReason: "",
  };

  const factorUrgencia = { critica: 0.25, alta: 0.5, media: 1, baja: 1.6 }[doc.priority];
  const [minH, maxH] = categoria.horasResolucion;

  const probAtencion = { critica: 0.95, alta: 0.85, media: 0.7, baja: 0.5 }[doc.priority];
  if (Math.random() > probAtencion) {
    doc.status = "open";
    doc.statusHistory = [];
    return;
  }

  const operador = elegir(operadores);
  const horasHastaAtencion = azar(2, 96) * factorUrgencia;
  const inicioAtencion = new Date(creado.getTime() + horasHastaAtencion * 3600e3);
  if (inicioAtencion > ahora) {
    doc.status = "open";
    doc.statusHistory = [];
    return;
  }

  doc.statusHistory = [
    { from: "open", to: "in_progress", changedAt: inicioAtencion, changedBy: operador._id },
  ];
  doc.inProgressAt = inicioAtencion;
  doc.status = "in_progress";

  const probResolucion = { critica: 0.9, alta: 0.8, media: 0.68, baja: 0.55 }[doc.priority];
  if (Math.random() > probResolucion) return;

  const horasHastaResolucion = azar(minH, maxH) * factorUrgencia;
  const fechaResolucion = new Date(inicioAtencion.getTime() + horasHastaResolucion * 3600e3);
  if (fechaResolucion > ahora) return;

  doc.statusHistory.push({
    from: "in_progress",
    to: "resolved",
    changedAt: fechaResolucion,
    changedBy: operador._id,
  });
  doc.resolvedAt = fechaResolucion;
  doc.status = "resolved";
  doc.updatedAt = fechaResolucion;
}

async function generar() {
  const ahora = new Date();
  const desde = new Date(ahora.getTime() - MESES_DE_HISTORIA * 30 * 24 * 3600e3);

  const { ciudadanos, moderadores, operadores } = await crearUsuariosDemo();
  console.log(`👥 Creados ${ciudadanos.length + moderadores.length + operadores.length} usuarios de demo.`);

  const originales = [];

  for (let i = 0; i < CANTIDAD_INCIDENTES; i++) {
    const categoria = CATEGORIAS.find(
      (c) => c.clave === elegirPonderado(CATEGORIAS.map((c) => ({ valor: c.clave, peso: c.peso })))
    );
    const barrio = BARRIOS.find(
      (b) => b.nombre === elegirPonderado(BARRIOS.map((b) => ({ valor: b.nombre, peso: b.peso })))
    );

    // Más reportes en los meses recientes que al inicio del período.
    const sesgo = Math.pow(Math.random(), 0.7);
    const fechaCreacion = new Date(desde.getTime() + sesgo * (ahora - desde));

    const doc = construirIncidente({
      categoria,
      fechaCreacion,
      barrio,
      coord: coordenadaCercana(barrio),
      autor: elegir(ciudadanos),
    });
    aplicarCicloDeVida(doc, categoria, moderadores, operadores, ahora);
    originales.push({ doc, categoria, barrio, fechaCreacion });
  }

  const insertados = await Incident.insertMany(originales.map((o) => o.doc), { timestamps: false });
  console.log(`📄 Insertados ${insertados.length} incidentes originales.`);

  // ─── Duplicados ────────────────────────────────────────────────────────────
  // Un mismo problema físico suele generar varios reportes. Se construyen
  // grupos de duplicados alrededor de incidentes originales ya insertados.
  const duplicados = [];
  const candidatos = insertados
    .map((inc, i) => ({ inc, ...originales[i] }))
    .filter(({ inc }) => inc.moderation.status === "approved");

  for (const { inc, categoria, barrio, fechaCreacion } of candidatos) {
    // La cantidad de reportes crece con la prioridad, que es el patrón esperable.
    const probabilidadBase = { critica: 0.55, alta: 0.4, media: 0.22, baja: 0.12 }[inc.priority];
    if (Math.random() > probabilidadBase) continue;

    const cantidad = elegirPonderado([
      { valor: 1, peso: 45 }, { valor: 2, peso: 28 }, { valor: 3, peso: 15 },
      { valor: 4, peso: 8 }, { valor: 6, peso: 4 },
    ]);

    for (let d = 0; d < cantidad; d++) {
      const fecha = new Date(fechaCreacion.getTime() + azar(0.5, 120) * 3600e3);
      if (fecha > ahora) continue;

      const dup = construirIncidente({
        categoria,
        fechaCreacion: fecha,
        barrio,
        coord: coordenadaCercana(barrio, 0.0012),
        autor: elegir(ciudadanos),
        prioridadForzada: inc.priority,
      });
      dup.possibleDuplicateOf = inc._id;
      dup.moderation = {
        status: "approved",
        moderatedBy: elegir(moderadores)._id,
        moderatedAt: new Date(fecha.getTime() + azar(1, 24) * 3600e3),
        rejectionReason: "",
      };
      dup.status = "open";
      dup.statusHistory = [];
      duplicados.push(dup);
    }
  }

  // ─── Anomalías deliberadas ────────────────────────────────────────────────
  // Casos que rompen el patrón, para que el análisis de coherencia entre
  // cantidad de reportes y prioridad tenga hallazgos reales que interpretar.
  const anomalias = [];
  const residuos = CATEGORIAS.find((c) => c.clave === "residuos");
  const seguridad = CATEGORIAS.find((c) => c.clave === "seguridad");

  // (a) Muy reportados pero con prioridad baja: molestia extendida, no urgente.
  for (let i = 0; i < 6; i++) {
    const barrio = elegir(BARRIOS);
    const fecha = new Date(desde.getTime() + Math.random() * (ahora - desde));
    const base = construirIncidente({
      categoria: residuos, fechaCreacion: fecha, barrio,
      coord: coordenadaCercana(barrio), autor: elegir(ciudadanos),
      prioridadForzada: "baja",
    });
    base.moderation = { status: "approved", moderatedBy: elegir(moderadores)._id, moderatedAt: fecha, rejectionReason: "" };
    base.status = "open";
    const [creado] = await Incident.insertMany([base], { timestamps: false });

    for (let d = 0; d < entero(7, 11); d++) {
      const f = new Date(fecha.getTime() + azar(1, 200) * 3600e3);
      if (f > ahora) continue;
      const dup = construirIncidente({
        categoria: residuos, fechaCreacion: f, barrio,
        coord: coordenadaCercana(barrio, 0.001), autor: elegir(ciudadanos),
        prioridadForzada: "baja",
      });
      dup.possibleDuplicateOf = creado._id;
      dup.moderation = { status: "approved", moderatedBy: elegir(moderadores)._id, moderatedAt: f, rejectionReason: "" };
      dup.status = "open";
      dup.statusHistory = [];
      anomalias.push(dup);
    }
  }

  // (b) Un solo reporte pero crítico: riesgo real detectado por un único vecino.
  for (let i = 0; i < 8; i++) {
    const barrio = elegir(BARRIOS);
    const fecha = new Date(desde.getTime() + Math.random() * (ahora - desde));
    const doc = construirIncidente({
      categoria: seguridad, fechaCreacion: fecha, barrio,
      coord: coordenadaCercana(barrio), autor: elegir(ciudadanos),
      prioridadForzada: "critica",
    });
    aplicarCicloDeVida(doc, seguridad, moderadores, operadores, ahora);
    doc.moderation.status = "approved";
    anomalias.push(doc);
  }

  const extra = [...duplicados, ...anomalias];
  if (extra.length) await Incident.insertMany(extra, { timestamps: false });
  console.log(`📄 Insertados ${duplicados.length} duplicados y ${anomalias.length} casos atípicos.`);

  return insertados.length + extra.length;
}

async function main() {
  const reset = process.argv.includes("--reset");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`🔌 Conectado a la base "${mongoose.connection.name}".\n`);

  if (reset) await limpiarDatosDemo();

  const total = await generar();

  const resumen = await Incident.aggregate([
    { $match: { "moderation.status": "approved" } },
    { $group: { _id: "$priority", cantidad: { $sum: 1 } } },
    { $sort: { cantidad: -1 } },
  ]);

  console.log(`\n✅ Total de documentos generados: ${total}`);
  console.log("📊 Incidentes aprobados por prioridad:");
  resumen.forEach((r) => console.log(`   ${r._id.padEnd(8)} ${r.cantidad}`));
  console.log("\n⚠️  Son datos sintéticos de demostración, no reportes reales.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
