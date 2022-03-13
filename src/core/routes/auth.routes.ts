import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router: Router = Router();

router.post("/auth", AuthController.login);

export default router;
