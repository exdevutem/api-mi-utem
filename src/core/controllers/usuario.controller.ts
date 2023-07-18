import {NextFunction, Request, Response} from "express";
import GenericError from "../../infrastructure/models/error.model";
import {MiUtemAuthService} from "../../mi-utem/services/auth.service";
import {MiUtemUserService} from "../../mi-utem/services/user.service";
import {PasaportePasswordService} from "../../pasaporte/services/password.service";
import Cookie from "../../infrastructure/models/cookie.model";

export class UsuarioController {
  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correo: string = req.body.correo;

      if (correo.endsWith("@utem.cl")) {
        const respuesta: any = await PasaportePasswordService.resetPassword(correo);

        res.status(200).json(respuesta);
      } else {
        throw GenericError.CORREO_UTEM_INVALIDO;
      }
    } catch (error) {
      next(error);
    }
  }

  public static async changeProfilePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correo: string = req.body.correo;
      const contrasenia: string = req.body.contrasenia;
      const cookies: Cookie[] = await MiUtemAuthService.loginAndGetCookies(correo, contrasenia);

      const base64Image: string = req.body.imagen;
      const respuesta: any = await MiUtemUserService.changeProfilePicture(
        cookies,
        base64Image
      );

      res.status(200).json(respuesta);
    } catch (error) {
      next(error);
    }
  }
}
