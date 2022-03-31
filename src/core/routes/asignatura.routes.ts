import { Router } from "express";
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
router.get(
  "/asignaturas/historicas",
  CredentialsMiddleware.isLoggedIn,
  AsignaturaController.getHistoricas
);
router.post("/notas/notificar", NotificacionController.notificate);

export default router;
