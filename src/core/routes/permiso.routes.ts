import { Router } from "express";
import { PermisoController } from "../controllers/permiso.controller";

const router: Router = Router();

router.post(
  "/permisos",
  PermisoController.getAll
);
router.post(
  "/permisos/:permisoId",
  PermisoController.getOne
);

export default router;
