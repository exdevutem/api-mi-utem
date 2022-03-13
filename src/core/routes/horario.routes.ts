import { Router } from "express";
import { CredentialsMiddleware } from "../../infrastructure/middlewares/credentials.middleware";
import { HorarioController } from "../controllers/horario.controller";

const router: Router = Router();

router.get(
  "/carreras/:carreraId/horarios",
  CredentialsMiddleware.isLoggedIn,
  HorarioController.get
);

export default router;
