import { Router } from "express";
import { CarreraController } from "../controllers/carrera.controller";
import {SigaCredentialsMiddleware} from "../../infrastructure/middlewares/credentials/siga-credentials.middleware";

const router: Router = Router();

router.get(
  "/carreras",
  SigaCredentialsMiddleware.isLoggedIn,
  CarreraController.getAll
);

export default router;
