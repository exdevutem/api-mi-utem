import { Router } from "express";
import {BecaAlimentacionController} from "../controllers/beca-alimentacion.controller";
import {AcademiaCredentialsMiddleware} from "../../infrastructure/middlewares/credentials/academia-credentials.middleware";

const router: Router = Router();

router.get(
    "/beca-alimentacion",
    AcademiaCredentialsMiddleware.isLoggedIn,
    BecaAlimentacionController.getCodigoBecaAlimentacion
);

router.post(
  "/beca-alimentacion",
  AcademiaCredentialsMiddleware.isLoggedIn,
  BecaAlimentacionController.solicitarCodigoBecaAlimentacion
);

export default router;
