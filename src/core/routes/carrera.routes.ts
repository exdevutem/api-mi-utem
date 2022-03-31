import { Router } from "express";
import { CredentialsMiddleware } from "../../infrastructure/middlewares/credentials.middleware";
import { CarreraController } from "../controllers/carrera.controller";

const router: Router = Router();

router.get(
  "/carreras",
  CredentialsMiddleware.isLoggedIn,
  CarreraController.getAll
);

export default router;
