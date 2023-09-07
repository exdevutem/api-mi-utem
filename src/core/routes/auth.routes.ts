import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router: Router = Router();

router.post("/auth", AuthController.login);
router.post("/auth/refresh", AuthController.refresh);

export default router;
