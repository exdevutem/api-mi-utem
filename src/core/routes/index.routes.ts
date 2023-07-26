import { Router } from "express";
import AsignaturaRouter from "./asignatura.routes";
import AuthRouter from "./auth.routes";
import CarreraRouter from "./carrera.routes";
import HorarioRouter from "./horario.routes";
import PermisoRouter from "./permiso.routes";
import UsuarioRouter from "./usuario.routes";
import AcademiaRoutes from "./academia.routes";

const router: Router = Router();

router.use("/", AuthRouter);
router.use("/", UsuarioRouter);
router.use("/", HorarioRouter);
router.use("/", CarreraRouter);
router.use("/", AsignaturaRouter);
router.use("/", PermisoRouter);
router.use("/", AcademiaRoutes)

export default router;
