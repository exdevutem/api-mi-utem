import { Router } from "express";
import {CredentialsMiddleware} from "../../infrastructure/middlewares/credentials.middleware";
import {AcademiaController} from "../controllers/academia.controller";

const router: Router = Router();

router.post(
    "/academia/beca_alimentacion",
    CredentialsMiddleware.isLoggedIn,
    AcademiaController.getCodigoBecaAlimentacion
);

export default router;
