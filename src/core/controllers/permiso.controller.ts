import {NextFunction, Request, Response} from "express";
import {MiUtemAuthService} from "../../mi-utem/services/auth.service";
import {MiUtemPermisoService} from "../../mi-utem/services/permiso.service";
import Permiso from "../models/permiso.model";
import Cookie from "../../infrastructure/models/cookie.model";

export class PermisoController {
    public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const correo: string = req.body.correo;
            const contrasenia: string = req.body.contrasenia;
            const cookies: Cookie[] = await MiUtemAuthService.loginAndGetCookies(
                correo,
                contrasenia
            );

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
            const correo: string = req.body.correo;
            const contrasenia: string = req.body.contrasenia;
            const cookies: Cookie[] = await MiUtemAuthService.loginAndGetCookies(
                correo,
                contrasenia
            );

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
