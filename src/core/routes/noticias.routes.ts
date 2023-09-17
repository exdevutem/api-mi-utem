import { Router } from "express";
import {NoticiaController} from "../controllers/noticia.controller";

const router: Router = Router();

router.get(
  "/noticias",
  NoticiaController.getNoticias
);

export default router;
