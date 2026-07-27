import { Router } from "express";
import { clerkAuth } from "../middlewares/clerkAuth.js";
import { attachUser } from "../middlewares/attachUser.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { changeRoleSchema } from "../utils/schemas.js";
import * as userController from "../controllers/userController.js";

const router = Router();

router.use(clerkAuth, attachUser, requireRole(["admin"]));
router.get("/", userController.listUsers);
router.patch("/:id/role", validate(changeRoleSchema), userController.changeUserRole);

export default router;
