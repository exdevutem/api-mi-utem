import { NextFunction, Request, Response } from "express";
import { Cookie } from "puppeteer";
import GenericError from "../../infrastructure/models/error.model";
import CredentialsUtils from "../../infrastructure/utils/credentials.utils";
import GenericLogger from "../../infrastructure/utils/logger.utils";
import { MiUtemAuthService } from "../../mi-utem/services/auth.service";
import { MiUtemUserService } from "../../mi-utem/services/user.service";
import { SigaApiAuthService } from "../../siga-api/services/auth.service";
import Usuario from "../models/usuario.model";

export class AuthController {
  public static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const correo: string = req.body.correo;
      const contrasenia: string = req.body.contrasenia;
      let cookies: Cookie[];

      const usuarioSiga: Usuario = await SigaApiAuthService.loginAndGetProfile(
        correo,
        contrasenia
      );
      const sigaToken = usuarioSiga.token;

      let usuarioMiUtem: Usuario;

      try {
        cookies = await MiUtemAuthService.loginAndGetCookies(
          correo,
          contrasenia
        );

        usuarioMiUtem = await MiUtemUserService.getProfile(cookies);
      } catch (error) {
        GenericLogger.log({
          level: "error",
          message: error.message,
        });
      }

      if (sigaToken) {
        const usuarioToken: Usuario = CredentialsUtils.getSigaUser(sigaToken);

        const usuario: Usuario = { ...usuarioSiga, ...usuarioToken };
        usuario.token = CredentialsUtils.createToken(sigaToken, cookies);

        if (usuarioSiga.perfiles && usuarioSiga.perfiles.length) {
          if (usuarioSiga.perfiles.includes("Estudiante")) {
            res.status(200).json(usuario);
          } else {
            throw GenericError.NO_ESTUDIANTE;
          }
        } else {
          throw GenericError.SIN_ROL;
        }
      } else {
        throw GenericError.SIGA_UTEM_ERROR;
      }
    } catch (error) {
      next(error);
    }
  }
}
