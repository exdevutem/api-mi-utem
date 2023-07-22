import { Router } from "express";
import { PermisoController } from "../controllers/permiso.controller";
import {CredentialsMiddleware} from "../../infrastructure/middlewares/credentials.middleware";

const router: Router = Router();

router.post(
  "/permisos",
  CredentialsMiddleware.isLoggedIn,
  PermisoController.getAll
);
router.post(
  "/permisos/:permisoId",
  CredentialsMiddleware.isLoggedIn,
  PermisoController.getOne
);

export default router;
