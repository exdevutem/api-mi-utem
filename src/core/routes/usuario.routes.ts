import { Router } from "express";
import { UsuarioController } from "../controllers/usuario.controller";
import {MiUTEMCredentialsMiddleware} from "../../infrastructure/middlewares/credentials/miutem-credentials.middleware";

const router: Router = Router();

router.put(
  "/usuarios/contrasenia",
  UsuarioController.resetPassword
);
router.put(
  "/usuarios/foto",
  MiUTEMCredentialsMiddleware.isLoggedIn,
  UsuarioController.changeProfilePhoto
);

export default router;
