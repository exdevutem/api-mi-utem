import { Router } from "express";
import {AcademiaController} from "../controllers/academia.controller";
import {AcademiaCredentialsMiddleware} from "../../infrastructure/middlewares/credentials/academia-credentials.middleware";

const router: Router = Router();

router.get(
    "/academia/beca_alimentacion",
    AcademiaCredentialsMiddleware.isLoggedIn,
    AcademiaController.getCodigoBecaAlimentacion
);

export default router;
