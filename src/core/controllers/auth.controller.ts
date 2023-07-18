import {NextFunction, Request, Response} from "express";
import GenericError from "../../infrastructure/models/error.model";
import CredentialsUtils from "../../infrastructure/utils/credentials.utils";
import {SigaApiAuthService} from "../../siga-api/services/auth.service";
import Usuario from "../models/usuario.model";
// import {MiUtemAuthService} from "../../mi-utem/services/auth.service";
// import {MiUtemUserService} from "../../mi-utem/services/user.service";
import Cookie from "../../infrastructure/models/cookie.model";

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correo: string = req.body.correo;
      const contrasenia: string = req.body.contrasenia;

      const usuarioSiga = await SigaApiAuthService.loginAndGetProfile(correo, contrasenia);
      const sigaToken = usuarioSiga.token

      let cookies: Cookie[] = []// = await MiUtemAuthService.loginAndGetCookies(correo, contrasenia)

      let usuarioMiUtem: Usuario// = await MiUtemUserService.getProfile(cookies)

      if (!sigaToken) {
        throw GenericError.SIGA_UTEM_ERROR
      }

      const usuarioToken: Usuario = CredentialsUtils.getSigaUser(sigaToken);

      const usuario: Usuario = {...usuarioSiga, ...usuarioToken};
      usuario.token = CredentialsUtils.createToken(sigaToken, cookies);

      if (usuarioSiga.perfiles?.length == 0) {
        throw GenericError.SIN_ROL
      }

      if (!usuarioSiga.perfiles.includes("Estudiante")) {
        throw GenericError.NO_ESTUDIANTE
      }

      res.status(200).json({
        ...usuario,
        ...{
          fotoUrl: usuarioMiUtem?.fotoUrl,
        },
      });
    } catch (error) {
      next(error)
    }
  }
}
