import { Router } from "express";
import authRoutes from "./auth.routes.js";
import incidentRoutes from "./incidents.routes.js";
import userRoutes from "./users.routes.js";
import insightRoutes from "./insights.routes.js";
import publicRoutes from "./public.routes.js";

const router = Router();

// Scope 1 — privado, usado por la SPA (Clerk)
router.use("/v1/auth", authRoutes);
router.use("/v1/incidents", incidentRoutes);
router.use("/v1/users", userRoutes);
router.use("/v1/insights", insightRoutes);

// Scope 2 — público, consumo externo (ej. PowerBI) vía x-api-key
router.use("/public/v1", publicRoutes);

export default router;
