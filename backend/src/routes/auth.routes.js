import { Router } from "express";
import { clerkAuth } from "../middlewares/clerkAuth.js";
import { attachUser } from "../middlewares/attachUser.js";
import { getMe } from "../controllers/authController.js";

const router = Router();

router.get("/me", clerkAuth, attachUser, getMe);

export default router;
