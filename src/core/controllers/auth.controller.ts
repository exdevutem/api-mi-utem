import { NextFunction, Request, Response } from "express";
import Cookie from "../../infrastructure/models/cookie.model";
import GenericError from "../../infrastructure/models/error.model";
import CredentialsUtils from "../../infrastructure/utils/credentials.utils";
import { MiUtemAuthService } from "../../mi-utem/services/auth.service";
import { MiUtemUserService } from "../../mi-utem/services/user.service";
import { SigaApiAuthService } from "../../siga-api/services/auth.service";
import Usuario from "../models/usuario.model";
import {AcademiaUserService} from "../../academia/services/auth.service";

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correo: string = req.body.correo;
      const contrasenia: string = req.body.contrasenia;

      const academiaCookies = await AcademiaUserService.loginAndGetCookies(correo, contrasenia)

      const usuarioSiga = await SigaApiAuthService.loginAndGetProfile(correo, contrasenia);
      const sigaToken = usuarioSiga.token;

      if (!sigaToken) {
        throw GenericError.SIGA_UTEM_ERROR
      }

      let cookies: Cookie[];
      try {
        cookies = await MiUtemAuthService.loginAndGetCookies(correo, contrasenia);
      } catch (error) {
        console.log("No se pudo loggear en Mi UTEM");
      }

      const usuarioToken: Usuario = CredentialsUtils.getSigaUser(sigaToken);

      const usuario: Usuario = {...usuarioSiga, ...usuarioToken};
      usuario.token = CredentialsUtils.createToken(sigaToken, cookies, academiaCookies);

      if (usuarioSiga.perfiles?.length == 0) {
        throw GenericError.SIN_ROL
      }

      if (!usuarioSiga.perfiles.includes("Estudiante")) {
        throw GenericError.NO_ESTUDIANTE
      }

      if (cookies) {
        try {
          let usuarioMiUtem: Usuario = await MiUtemUserService.getProfile(cookies);
          usuario = {
            ...usuario,
            ...{
              fotoUrl: usuarioMiUtem?.fotoUrl,
            }
          };
        } catch (error) {
          console.log("No se pudo obtener el perfil de Mi UTEM");
        }
      }

      res.status(200).json(usuario);
    } catch (error) {
      next(error)
    }
  }
}
