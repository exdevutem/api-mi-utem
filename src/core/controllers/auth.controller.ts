import { NextFunction, Request, Response } from "express";
import { AcademiaUserService } from "../../academia/services/auth.service";
import { CredentialsMiddleware } from "../../infrastructure/middlewares/credentials/credentials.middleware";
import Cookie from "../../infrastructure/models/cookie.model";
import GenericError from "../../infrastructure/models/error.model";
import CredentialsUtils from "../../infrastructure/utils/credentials.utils";
import { MiUtemAuthService } from "../../mi-utem/services/auth.service";
import { MiUtemUserService } from "../../mi-utem/services/user.service";
import { SigaApiAuthService } from "../../siga-api/services/auth.service";
import Usuario from "../models/usuario.model";
import {cache} from "../../app";

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correo: string = req.body.correo || '';
      const contrasenia: string = req.body.contrasenia || '';
      if (correo.length === 0 || contrasenia.length === 0) {
        throw GenericError.CREDENCIALES_INCORRECTAS
      }

      /* Busca inicio de sesión en cache */
      const cacheKey = btoa(`login:${correo}`)
      const cached = cache.get<Usuario>(cacheKey)
      if(cached != undefined) {
        res.status(200).json(cached);
        return;
      }

      /* Inicia sesión en Siga */
      const usuarioSigaByAuth = await SigaApiAuthService.loginAndGetProfile(correo, contrasenia); // Usuario generado por autenticación
      const sigaToken = usuarioSigaByAuth.token;

      if (!sigaToken) {
        throw GenericError.SIGA_UTEM_ERROR
      }

      /* Inicia sesión en Academia.UTEM */
      let academiaCookies: Cookie[];
      try {
        academiaCookies = await AcademiaUserService.loginAndGetCookies(correo, contrasenia)
      } catch (error) {
        console.debug({
          error
        })
        console.log("No se pudo loggear en Academia");
      }

      /* Inicia sesión en Mi.UTEM */
      let miUtemCookies: Cookie[];
      try {
        miUtemCookies = await MiUtemAuthService.loginAndGetCookies(correo, contrasenia);
      } catch (error) {
        console.log("No se pudo loggear en Mi UTEM");
      }

      /* Crea usuario y asigna un token para futuro uso de autorización */
      const usuarioSigaByToken: Usuario = CredentialsUtils.getSigaUser(sigaToken); // Usuario generado por jwt (json web token)
      const usuario: Usuario = { ...usuarioSigaByAuth, ...usuarioSigaByToken };
      usuario.token = CredentialsUtils.createToken(sigaToken, miUtemCookies, academiaCookies);

      /* Valida que el usuario tenga un rol */
      if (usuarioSigaByAuth.perfiles?.length == 0) {
        throw GenericError.SIN_ROL
      }

      /* Valida que el usuario sea estudiante */
      if (!usuarioSigaByAuth.perfiles.includes("Estudiante")) {
        throw GenericError.NO_ESTUDIANTE
      }

      /* Asigna datos obtenidos utilizando el perfil Mi.UTEM */
      if (miUtemCookies) {
        try {
          const usuarioMiUtem: Usuario = await MiUtemUserService.getProfile(miUtemCookies);
          usuario.perfiles = usuarioMiUtem?.perfiles || usuario.perfiles;
          usuario.nombreCompleto = usuarioMiUtem?.nombreCompleto || usuario.nombreCompleto;
          usuario.rut = usuarioMiUtem?.rut || usuario.rut;
          usuario.fotoUrl = usuarioMiUtem?.fotoUrl || usuario.fotoUrl;
        } catch (error) {
          console.log("No se pudo obtener el perfil de Mi UTEM");
        }
      }

      cache.set(cacheKey, usuario, 300) // Guarda en cache por 5 minutos
      res.status(200).json(usuario);
    } catch (error) {
      next(error)
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accessToken = CredentialsMiddleware.validateToken(req);
      const correo: string = req.body.correo;
      const contrasenia: string = req.body.contrasenia;

      if (!correo || !contrasenia) {
        throw GenericError.BAD_REQUEST;
      }

      let sigaToken: string = CredentialsUtils.getSigaToken(accessToken);
      let miUtemCookies: Cookie[] = CredentialsUtils.getMiUtemCookies(accessToken);
      let academiaCookies: Cookie[] = CredentialsUtils.getAcademiaCookies(accessToken);

      if (miUtemCookies.length === 0) {
        try {
          miUtemCookies = await MiUtemAuthService.loginAndGetCookies(correo, contrasenia);
        } catch (error) {
          console.log("No se pudo refrescar la token de Mi UTEM");
        }
      }

      if (academiaCookies.length === 0) {
        try {
          academiaCookies = await AcademiaUserService.loginAndGetCookies(correo, contrasenia);
        } catch (error) {
          console.log("No se pudo refrescar la token de Academia UTEM");
        }
      }

      if (CredentialsUtils.isTokenExpired(sigaToken)) {
        try {
          sigaToken = await SigaApiAuthService.loginAndGetToken(req.body.correo, req.body.contrasenia);
        } catch (error) {
          console.log("No se pudo refrescar la token de SIGA UTEM");
        }
      }

      let token = CredentialsUtils.createToken(sigaToken, miUtemCookies, academiaCookies);

      res.status(200).json({ token });
    } catch (error) {
      next(error)
    }
  }
}
