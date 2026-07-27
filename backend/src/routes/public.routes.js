import { Router } from "express";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.js";
import { publicApiLimiter } from "../middlewares/rateLimit.js";
import * as publicController from "../controllers/publicController.js";

const router = Router();

router.use(publicApiLimiter, apiKeyAuth);
router.get("/incidents", publicController.listPublicIncidents);
router.get("/stats", publicController.getPublicStats);

export default router;
