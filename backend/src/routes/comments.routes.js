import { Router } from "express";
import { clerkAuth } from "../middlewares/clerkAuth.js";
import { attachUser } from "../middlewares/attachUser.js";
import { validate } from "../middlewares/validate.js";
import { createCommentSchema } from "../utils/schemas.js";
import * as commentController from "../controllers/commentController.js";

const router = Router({ mergeParams: true });

router.use(clerkAuth, attachUser);
router.get("/", commentController.listComments);
router.post("/", validate(createCommentSchema), commentController.createComment);

export default router;
