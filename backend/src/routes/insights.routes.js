import { Router } from "express";
import { clerkAuth } from "../middlewares/clerkAuth.js";
import { attachUser } from "../middlewares/attachUser.js";
import { requireRole } from "../middlewares/requireRole.js";
import { getInsights } from "../controllers/insightController.js";

const router = Router();

router.get("/", clerkAuth, attachUser, requireRole(["admin"]), getInsights);

export default router;
