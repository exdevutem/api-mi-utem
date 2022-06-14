import { Router } from "express";
import { BrowserMiddleware } from "../../infrastructure/middlewares/browser.middleware";
import { PermisoController } from "../controllers/permiso.controller";

const router: Router = Router();

router.post(
  "/permisos",
  BrowserMiddleware.requireActiveBrowser,
  PermisoController.getAll
);
router.post(
  "/permisos/:permisoId",
  BrowserMiddleware.requireActiveBrowser,
  PermisoController.getOne
);

export default router;
