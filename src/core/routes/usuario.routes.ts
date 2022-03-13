import { Router } from "express";
import { CredentialsMiddleware } from "../../infrastructure/middlewares/credentials.middleware";
import { UsuarioController } from "../controllers/usuario.controller";

const router: Router = Router();

router.put("/usuarios/contrasenia", UsuarioController.resetPassword);
router.put(
  "/usuarios/foto",
  CredentialsMiddleware.isLoggedIn,
  UsuarioController.changeProfilePhoto
);

export default router;
