// Configuración común de las pruebas: variables de entorno de prueba y una
// instancia efímera de MongoDB en memoria, para no depender de credenciales
// reales ni contaminar la base del proyecto.
import { beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Debe ejecutarse antes de que src/config/env.js valide la configuración.
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://placeholder";
process.env.CLERK_SECRET_KEY = "sk_test_fake";
process.env.CLERK_PUBLISHABLE_KEY = "pk_test_fake";
process.env.PUBLIC_API_KEY = "clave-publica-de-prueba";
process.env.FRONTEND_URL = "http://localhost:5173";

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
