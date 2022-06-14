import { Router } from "express";
import { BrowserMiddleware } from "../../infrastructure/middlewares/browser.middleware";
import { CredentialsMiddleware } from "../../infrastructure/middlewares/credentials.middleware";
import { AsignaturaController } from "../controllers/asignatura.controller";
import { NotificacionController } from "../controllers/notificacion.controller";

const router: Router = Router();

router.get(
  "/carreras/:carreraId/asignaturas",
  CredentialsMiddleware.isLoggedIn,
  AsignaturaController.getActivasByCarrera
);
router.get(
  "/carreras/:carreraId/asignaturas/:seccionId/notas",
  CredentialsMiddleware.isLoggedIn,
  AsignaturaController.getNotasByAsignatura
);
router.post(
  "/asignaturas/historicas",
  BrowserMiddleware.requireActiveBrowser,
  AsignaturaController.getHistoricas
);
router.post("/notas/notificar", NotificacionController.notificate);

export default router;
