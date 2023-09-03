import { Router } from "express";
import { HorarioController } from "../controllers/horario.controller";
import {SigaCredentialsMiddleware} from "../../infrastructure/middlewares/credentials/siga-credentials.middleware";

const router: Router = Router();

router.get(
  "/carreras/:carreraId/horarios",
  SigaCredentialsMiddleware.isLoggedIn,
  HorarioController.get
);

export default router;
