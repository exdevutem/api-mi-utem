import {NextFunction, Request, Response} from "express";
import {MiUtemPermisoService} from "../../mi-utem/services/permiso.service";
import Permiso from "../../mi-utem/models/permiso.model";
import Cookie from "../models/internal/cookie.model";

export class PermisoController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cookies: Cookie[] = res.locals.loggedInUser.miUtemCookies
      const permisos: Permiso[] = await MiUtemPermisoService.getPermisos(
        cookies
      );

      res.status(200).json(permisos);
    } catch (error) {
      next(error);
    }
  }

  public static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cookies: Cookie[] = res.locals.loggedInUser.miUtemCookies
      const permisoId: string = req.params.permisoId;
      const permiso: Permiso = await MiUtemPermisoService.getDetallePermiso(
        cookies,
        permisoId
      );

      res.status(200).json(permiso);
    } catch (error) {
      next(error);
    }
  }
}
