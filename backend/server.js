import { env } from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import { app } from "./src/app.js";
import { logger } from "./src/utils/logger.js";

async function start() {
  await connectDB();

  app.listen(env.port, () => {
    logger.info(`UrbanLog backend corriendo en http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  logger.error("No se pudo iniciar el servidor:", err.message);
  process.exit(1);
});
