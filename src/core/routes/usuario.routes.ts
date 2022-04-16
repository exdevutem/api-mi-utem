import { Router } from "express";
import { BrowserMiddleware } from "../../infrastructure/middlewares/browser.middleware";
import { UsuarioController } from "../controllers/usuario.controller";

const router: Router = Router();

router.put("/usuarios/contrasenia", UsuarioController.resetPassword);
router.put(
  "/usuarios/foto",
  BrowserMiddleware.requireActiveBrowser,
  UsuarioController.changeProfilePhoto
);

export default router;
