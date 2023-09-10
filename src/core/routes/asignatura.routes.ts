import { Router } from "express";
import { AsignaturaController } from "../controllers/asignatura.controller";
import { NotificacionController } from "../controllers/notificacion.controller";
import {SigaCredentialsMiddleware} from "../../infrastructure/middlewares/credentials/siga-credentials.middleware";
import {MiUTEMCredentialsMiddleware} from "../../infrastructure/middlewares/credentials/miutem-credentials.middleware";

const router: Router = Router();

router.get(
  "/carreras/:carreraId/asignaturas",
  SigaCredentialsMiddleware.isLoggedIn,
  AsignaturaController.getActivasByCarrera
);
router.get(
  "/carreras/:carreraId/asignaturas/:seccionId/notas",
  SigaCredentialsMiddleware.isLoggedIn,
  AsignaturaController.getNotasByAsignatura
);
router.post(
  "/asignaturas/historicas",
  MiUTEMCredentialsMiddleware.isLoggedIn,
  AsignaturaController.getHistoricas
);
router.get(
  "/asignaturas/:codigoId",
  MiUTEMCredentialsMiddleware.isLoggedIn,
  AsignaturaController.getDetalle
);
router.post("/notas/notificar", NotificacionController.notificate);

export default router;
