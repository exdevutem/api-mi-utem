import { Router } from "express";
import AsignaturaRouter from "./asignatura.routes";
import AuthRouter from "./auth.routes";
import CarreraRouter from "./carrera.routes";
import HorarioRouter from "./horario.routes";
import UsuarioRouter from "./usuario.routes";

const router: Router = Router();

router.use("/", AuthRouter);
router.use("/", UsuarioRouter);
router.use("/", HorarioRouter);
router.use("/", CarreraRouter);
router.use("/", AsignaturaRouter);

export default router;
