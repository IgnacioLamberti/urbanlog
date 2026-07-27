import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimit.js";

export const app = express();

// Detrás del proxy de la plataforma de despliegue (Render, Railway) la IP real
// del cliente llega en X-Forwarded-For; sin esto el rate limiting agruparía
// todas las peticiones bajo la IP del proxy.
app.set("trust proxy", 1);

app.use(helmet());

// Se admite una lista de orígenes separados por coma para poder habilitar a la
// vez el frontend de producción y el entorno local.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
  })
);

app.use(express.json({ limit: "1mb" }));
if (env.nodeEnv !== "test") app.use(morgan(env.isProduction ? "combined" : "dev"));
app.use(clerkMiddleware());

app.get("/health", (req, res) =>
  res.json({ status: "ok", environment: env.nodeEnv, timestamp: new Date().toISOString() })
);

app.use("/api", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);
