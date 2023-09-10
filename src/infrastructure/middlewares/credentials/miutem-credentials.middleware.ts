import { NextFunction, Request, Response } from "express";
import { MiUtemAuthService } from "../../../mi-utem/services/auth.service";
import Cookie from "../../models/cookie.model";
import GenericError from "../../models/error.model";
import CredentialsUtils from "../../utils/credentials.utils";
import { CredentialsMiddleware } from "./credentials.middleware";

export class MiUTEMCredentialsMiddleware extends CredentialsMiddleware {

  public static async isLoggedIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let miUtemCookies: Cookie[];

      let error = GenericError.TOKEN_INVALIDA;
      let tokenExist: boolean = MiUTEMCredentialsMiddleware.validateTokenExist(req);

      if (tokenExist) {
        let accessToken: string = MiUTEMCredentialsMiddleware.validateTokenFormat(req);
        miUtemCookies = CredentialsUtils.getMiUtemCookies(accessToken);
      } else {
        if (req.body.correo && req.body.contrasenia) {
          miUtemCookies = await MiUtemAuthService.loginAndGetCookies(req.body.correo, req.body.contrasenia);
        } else {
          error.internalCode = 10.1
          throw error;
        }
      }

      if (miUtemCookies.length === 0) {
        error.internalCode = 10.3
        throw error;
      }

      res.locals.loggedInUser = {
        ...res.locals.loggedInUser,
        miUtemCookies,
      }
      next();
    } catch (error: any) {
      next(error)
    }
  }
}
