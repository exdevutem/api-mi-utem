import { Router } from "express";
import { PermisoController } from "../controllers/permiso.controller";
import {MiUTEMCredentialsMiddleware} from "../../infrastructure/middlewares/credentials/miutem-credentials.middleware";

const router: Router = Router();

router.post(
  "/permisos",
  MiUTEMCredentialsMiddleware.isLoggedIn,
  PermisoController.getAll
);
router.post(
  "/permisos/:permisoId",
  MiUTEMCredentialsMiddleware.isLoggedIn,
  PermisoController.getOne
);

export default router;
