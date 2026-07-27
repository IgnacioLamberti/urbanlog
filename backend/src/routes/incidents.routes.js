import { Router } from "express";
import { clerkAuth } from "../middlewares/clerkAuth.js";
import { attachUser } from "../middlewares/attachUser.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { upload } from "../middlewares/upload.js";
import { createIncidentLimiter } from "../middlewares/rateLimit.js";
import { updateStatusSchema, moderateIncidentSchema } from "../utils/schemas.js";
import * as incidentController from "../controllers/incidentController.js";
import commentsRoutes from "./comments.routes.js";

const router = Router();

router.use(clerkAuth, attachUser);

router.get("/stats", incidentController.getStats);
router.get("/", incidentController.listIncidents);
router.post("/", createIncidentLimiter, upload.array("images", 4), incidentController.createIncident);
router.get("/:id", incidentController.getIncident);

router.patch(
  "/:id/status",
  requireRole(["operator", "admin"]),
  validate(updateStatusSchema),
  incidentController.updateIncidentStatus
);

router.patch(
  "/:id/moderation",
  requireRole(["moderator", "admin"]),
  validate(moderateIncidentSchema),
  incidentController.moderateIncident
);

router.use("/:incidentId/comments", commentsRoutes);

export default router;
